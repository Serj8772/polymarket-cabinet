"""WebSocket-based stop-loss price monitor using Polymarket market channel.

Subscribes to real-time price updates for all tokens with active stop-losses.
On price change, immediately checks SL conditions and triggers FOK market sell.
Falls back to polling (60s) when the WebSocket is disconnected.
"""

import asyncio
import contextlib
import json
import logging
from datetime import UTC, datetime

import websockets
from sqlalchemy import select

from app.core.config import settings
from app.db.session import async_session_maker
from app.models.position import Position

logger = logging.getLogger(__name__)


class StopLossWSMonitor:
    """Real-time stop-loss monitor via Polymarket WebSocket market channel."""

    INITIAL_BACKOFF = 1.0
    MAX_BACKOFF = 60.0
    BACKOFF_MULTIPLIER = 2.0
    PING_INTERVAL = 10.0
    SUBSCRIPTION_REFRESH_INTERVAL = 120.0

    def __init__(self) -> None:
        self._ws: websockets.WebSocketClientProtocol | None = None  # type: ignore[name-defined]
        self._task: asyncio.Task | None = None  # type: ignore[type-arg]
        self._ping_task: asyncio.Task | None = None  # type: ignore[type-arg]
        self._refresh_task: asyncio.Task | None = None  # type: ignore[type-arg]
        self._subscribed_tokens: set[str] = set()
        self._sl_changed_event: asyncio.Event | None = None
        self._backoff = self.INITIAL_BACKOFF
        self._connected = False
        self._last_message_at: datetime | None = None

    @property
    def is_connected(self) -> bool:
        """Whether the WebSocket is currently connected and receiving data."""
        return self._connected

    async def start(self) -> None:
        """Start the WebSocket monitor as a background task."""
        self._sl_changed_event = asyncio.Event()
        self._task = asyncio.create_task(self._run_forever())
        logger.info("SL WebSocket monitor starting")

    async def stop(self) -> None:
        """Stop the WebSocket monitor and close connections."""
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None

        await self._close_ws()
        self._connected = False
        logger.info("SL WebSocket monitor stopped")

    def notify_sl_changed(self) -> None:
        """Signal that SL subscriptions may need updating.

        Safe to call from any coroutine. Triggers subscription resync.
        """
        if self._sl_changed_event:
            self._sl_changed_event.set()

    async def _run_forever(self) -> None:
        """Reconnection loop with exponential backoff."""
        while True:
            try:
                await self._connect_and_listen()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self._connected = False
                logger.warning(
                    "WS disconnected: %s — reconnecting in %.0fs", e, self._backoff,
                )
                await asyncio.sleep(self._backoff)
                self._backoff = min(
                    self._backoff * self.BACKOFF_MULTIPLIER, self.MAX_BACKOFF,
                )

    async def _connect_and_listen(self) -> None:
        """Connect, subscribe, and process messages until disconnect."""
        ws_url = settings.POLYMARKET_WS_CLOB + "market"
        logger.info("Connecting to %s", ws_url)

        async with websockets.connect(ws_url, ping_interval=None) as ws:
            self._ws = ws
            self._backoff = self.INITIAL_BACKOFF

            # Initial subscription
            tokens = await self._get_active_sl_tokens()
            if tokens:
                subscribe_msg = json.dumps({
                    "assets_ids": list(tokens),
                    "type": "market",
                    "custom_feature_enabled": True,
                })
                await ws.send(subscribe_msg)
                self._subscribed_tokens = tokens
                logger.info(
                    "WS SL monitor connected, subscribed to %d tokens", len(tokens),
                )
            else:
                logger.info("WS SL monitor connected, no active SL tokens to subscribe")
                self._subscribed_tokens = set()

            self._connected = True

            # Start heartbeat and subscription refresh tasks
            self._ping_task = asyncio.create_task(self._heartbeat_loop())
            self._refresh_task = asyncio.create_task(self._subscription_refresh_loop())

            try:
                async for raw_msg in ws:
                    self._last_message_at = datetime.now(UTC)
                    await self._handle_message(str(raw_msg))
            finally:
                self._connected = False
                self._cancel_subtask(self._ping_task)
                self._cancel_subtask(self._refresh_task)
                self._ping_task = None
                self._refresh_task = None
                self._ws = None

    async def _heartbeat_loop(self) -> None:
        """Send PING every 10 seconds to keep the connection alive."""
        try:
            while True:
                await asyncio.sleep(self.PING_INTERVAL)
                if self._ws:
                    await self._ws.send("PING")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.warning("Heartbeat failed: %s", e)

    async def _subscription_refresh_loop(self) -> None:
        """Periodically resync subscriptions (or on notify_sl_changed signal)."""
        try:
            while True:
                if self._sl_changed_event:
                    # Wait for event or timeout
                    try:
                        await asyncio.wait_for(
                            self._sl_changed_event.wait(),
                            timeout=self.SUBSCRIPTION_REFRESH_INTERVAL,
                        )
                        self._sl_changed_event.clear()
                    except TimeoutError:
                        pass

                await self._sync_subscriptions()
        except asyncio.CancelledError:
            pass

    async def _sync_subscriptions(self) -> None:
        """Compare current DB state with subscribed tokens, update accordingly."""
        if not self._ws:
            return

        current_tokens = await self._get_active_sl_tokens()
        to_subscribe = current_tokens - self._subscribed_tokens
        to_unsubscribe = self._subscribed_tokens - current_tokens

        try:
            if to_subscribe:
                msg = json.dumps({
                    "assets_ids": list(to_subscribe),
                    "operation": "subscribe",
                })
                await self._ws.send(msg)
                logger.info("WS subscribed to %d new tokens", len(to_subscribe))

            if to_unsubscribe:
                msg = json.dumps({
                    "assets_ids": list(to_unsubscribe),
                    "operation": "unsubscribe",
                })
                await self._ws.send(msg)
                logger.info("WS unsubscribed from %d tokens", len(to_unsubscribe))

            self._subscribed_tokens = current_tokens
        except Exception as e:
            logger.warning("Failed to update subscriptions: %s", e)

    async def _handle_message(self, raw: str) -> None:
        """Parse and dispatch incoming WebSocket messages."""
        if raw == "PONG":
            return

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return

        event_type = data.get("event_type")

        if event_type == "price_change":
            for change in data.get("price_changes", []):
                asset_id = change.get("asset_id")
                # Use best_bid as the sell-side price
                price_str = change.get("best_bid") or change.get("price")
                if asset_id and price_str:
                    try:
                        price = float(price_str)
                        await self._check_sl_for_token(asset_id, price)
                    except (ValueError, TypeError):
                        pass

        elif event_type == "last_trade_price":
            asset_id = data.get("asset_id")
            price_str = data.get("price")
            if asset_id and price_str:
                try:
                    price = float(price_str)
                    await self._check_sl_for_token(asset_id, price)
                except (ValueError, TypeError):
                    pass

    async def _check_sl_for_token(self, token_id: str, current_price: float) -> None:
        """Check if any positions with this token_id have triggered SL."""
        from app.services.trading_service import trading_service

        async with async_session_maker() as db:
            result = await db.execute(
                select(Position)
                .where(Position.token_id == token_id)
                .where(Position.stop_loss_price.isnot(None))
                .where(Position.size > 0)
                .where(Position.redeemable == False)  # noqa: E712
            )
            positions = list(result.scalars().all())

            for position in positions:
                sl_price = float(position.stop_loss_price)  # type: ignore
                if current_price <= sl_price:
                    await trading_service.execute_sl_for_position(
                        db, position, current_price,
                    )

    async def _get_active_sl_tokens(self) -> set[str]:
        """Query DB for distinct token_ids that have active stop-losses."""
        async with async_session_maker() as db:
            result = await db.execute(
                select(Position.token_id)
                .where(Position.stop_loss_price.isnot(None))
                .where(Position.size > 0)
                .where(Position.redeemable == False)  # noqa: E712
                .distinct()
            )
            return {row[0] for row in result.all()}

    async def _close_ws(self) -> None:
        """Close the WebSocket connection if open."""
        if self._ws:
            with contextlib.suppress(Exception):
                await self._ws.close()
            self._ws = None

    @staticmethod
    def _cancel_subtask(task: asyncio.Task | None) -> None:  # type: ignore[type-arg]
        """Cancel an asyncio task if it exists."""
        if task and not task.done():
            task.cancel()


# Module-level singleton
sl_ws_monitor = StopLossWSMonitor()
