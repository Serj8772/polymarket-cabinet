"""WebSocket-based stop-loss price monitor using Polymarket market channel.

Subscribes to real-time price updates for all tokens with active stop-losses.
On price change, checks SL conditions with spread filter and triggers FOK market sell.
Falls back to polling (60s) when the WebSocket is disconnected.
"""

import asyncio
import contextlib
import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime

import websockets
from sqlalchemy import select

from app.core.config import settings
from app.db.session import async_session_maker
from app.models.position import Position

logger = logging.getLogger(__name__)


@dataclass
class TokenSpread:
    """Latest spread data for a token from WebSocket events."""

    best_bid: float
    best_ask: float
    spread_bps: float
    updated_at: datetime


class StopLossWSMonitor:
    """Real-time stop-loss monitor via Polymarket WebSocket market channel."""

    INITIAL_BACKOFF = 1.0
    MAX_BACKOFF = 60.0
    BACKOFF_MULTIPLIER = 2.0
    PING_INTERVAL = 10.0
    SUBSCRIPTION_REFRESH_INTERVAL = 120.0

    # Spread filter constants
    SL_MAX_SPREAD_BPS: float = 500.0  # 5% — execute if spread <= this
    SL_SPREAD_WAIT_TIMEOUT_S: float = 120.0  # Hard timeout: execute after 120s regardless
    SL_MAX_DETERIORATION: float = 0.10  # 10% — if price drops 10% below SL, execute now

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
        # Spread filter state
        self._token_spreads: dict[str, TokenSpread] = {}
        self._sl_first_triggered: dict[str, datetime] = {}  # position_id -> first trigger

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
                self._token_spreads.clear()  # Stale after disconnect

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

    def _update_spread(
        self, token_id: str, best_bid: float, best_ask: float,
    ) -> TokenSpread:
        """Update cached spread data for a token and return the result."""
        midpoint = (best_bid + best_ask) / 2.0
        spread_bps = (
            (best_ask - best_bid) / midpoint * 10_000
            if midpoint > 0
            else 99_999.0
        )
        spread = TokenSpread(
            best_bid=best_bid,
            best_ask=best_ask,
            spread_bps=spread_bps,
            updated_at=datetime.now(UTC),
        )
        self._token_spreads[token_id] = spread
        return spread

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
                bid_str = change.get("best_bid")
                ask_str = change.get("best_ask")
                price_str = bid_str or change.get("price")

                # Update spread cache if both bid and ask available
                if asset_id and bid_str and ask_str:
                    with contextlib.suppress(ValueError, TypeError):
                        self._update_spread(
                            asset_id, float(bid_str), float(ask_str),
                        )

                if asset_id and price_str:
                    with contextlib.suppress(ValueError, TypeError):
                        await self._check_sl_for_token(asset_id, float(price_str))

        elif event_type == "best_bid_ask":
            asset_id = data.get("asset_id")
            bid_str = data.get("best_bid")
            ask_str = data.get("best_ask")
            if asset_id and bid_str and ask_str:
                try:
                    bid = float(bid_str)
                    ask = float(ask_str)
                    self._update_spread(asset_id, bid, ask)
                    await self._check_sl_for_token(asset_id, bid)
                except (ValueError, TypeError):
                    pass

        elif event_type == "last_trade_price":
            asset_id = data.get("asset_id")
            price_str = data.get("price")
            if asset_id and price_str:
                with contextlib.suppress(ValueError, TypeError):
                    await self._check_sl_for_token(asset_id, float(price_str))

    async def _check_sl_for_token(self, token_id: str, current_price: float) -> None:
        """Check SL conditions with spread filter for all positions on this token.

        Decision logic:
        - price > SL → clear pending trigger, skip
        - price <= SL AND spread <= threshold → execute immediately
        - price <= SL AND timeout exceeded → execute anyway (warning)
        - price <= SL AND price crashed > 10% below SL → execute immediately
        - otherwise → wait for next price update
        """
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

            # Clean up stale trigger entries
            active_pos_ids = {str(p.id) for p in positions}
            for k in [k for k in self._sl_first_triggered if k not in active_pos_ids]:
                del self._sl_first_triggered[k]

            for position in positions:
                sl_price = float(position.stop_loss_price)  # type: ignore
                pos_key = str(position.id)

                if current_price > sl_price:
                    self._sl_first_triggered.pop(pos_key, None)
                    continue

                # -- Price is at or below SL threshold --
                now = datetime.now(UTC)
                if pos_key not in self._sl_first_triggered:
                    self._sl_first_triggered[pos_key] = now
                    logger.info(
                        "SL triggered (spread check): position=%s price=%.4f sl=%.4f",
                        position.id, current_price, sl_price,
                    )

                first_triggered = self._sl_first_triggered[pos_key]
                elapsed_s = (now - first_triggered).total_seconds()

                spread_info = self._token_spreads.get(token_id)
                spread_bps = spread_info.spread_bps if spread_info else None

                execute = False
                reason = ""

                if spread_bps is not None and spread_bps <= self.SL_MAX_SPREAD_BPS:
                    execute = True
                    reason = f"spread={spread_bps:.0f}bps"
                elif elapsed_s >= self.SL_SPREAD_WAIT_TIMEOUT_S:
                    execute = True
                    s = f"{spread_bps:.0f}bps" if spread_bps is not None else "unknown"
                    reason = f"timeout {elapsed_s:.0f}s, spread={s}"
                    logger.warning(
                        "SL spread timeout: position=%s elapsed=%.0fs spread=%s",
                        position.id, elapsed_s, s,
                    )
                elif current_price < sl_price * (1 - self.SL_MAX_DETERIORATION):
                    execute = True
                    drop_pct = (1 - current_price / sl_price) * 100
                    reason = f"deterioration={drop_pct:.1f}%"
                    logger.warning(
                        "SL price deterioration: position=%s price=%.4f sl=%.4f (%.1f%% below)",
                        position.id, current_price, sl_price, drop_pct,
                    )
                else:
                    s = f"{spread_bps:.0f}bps" if spread_bps is not None else "unknown"
                    logger.debug(
                        "SL deferred: position=%s spread=%s elapsed=%.0fs",
                        position.id, s, elapsed_s,
                    )

                if execute:
                    logger.info(
                        "SL executing: position=%s reason=%s price=%.4f",
                        position.id, reason, current_price,
                    )
                    await trading_service.execute_sl_for_position(
                        db, position, current_price, spread_bps=spread_bps,
                    )
                    self._sl_first_triggered.pop(pos_key, None)

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
