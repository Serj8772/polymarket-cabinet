"""Polymarket API client — async wrapper for Gamma + CLOB APIs."""

import asyncio
import hashlib
import hmac
import logging
import time

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Rate limit semaphores
_gamma_semaphore = asyncio.Semaphore(15)
_clob_semaphore = asyncio.Semaphore(2)


class PolymarketClient:
    """Async HTTP client for Polymarket public APIs."""

    def __init__(self) -> None:
        self._http: httpx.AsyncClient | None = None

    async def start(self) -> None:
        """Initialize HTTP client. Call during app lifespan startup."""
        self._http = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
        logger.info("PolymarketClient started")

    async def close(self) -> None:
        """Close HTTP client. Call during app lifespan shutdown."""
        if self._http:
            await self._http.aclose()
            self._http = None
            logger.info("PolymarketClient closed")

    @property
    def http(self) -> httpx.AsyncClient:
        """Get the HTTP client instance."""
        if self._http is None:
            raise RuntimeError("PolymarketClient not started. Call start() first.")
        return self._http

    # --- Gamma API ---

    async def get_markets(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
        active: bool | None = None,
        closed: bool | None = None,
        tag: str | None = None,
    ) -> list[dict]:
        """Fetch markets from Gamma API.

        Gamma API returns a list of market objects.
        Rate limit: ~1000 req/hr.
        """
        params: dict = {"limit": limit, "offset": offset}
        if active is not None:
            params["active"] = str(active).lower()
        if closed is not None:
            params["closed"] = str(closed).lower()
        if tag:
            params["tag"] = tag

        async with _gamma_semaphore:
            resp = await self.http.get(
                f"{settings.POLYMARKET_GAMMA_API}/markets",
                params=params,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_events(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """Fetch events (groups of related markets) from Gamma API."""
        async with _gamma_semaphore:
            resp = await self.http.get(
                f"{settings.POLYMARKET_GAMMA_API}/events",
                params={"limit": limit, "offset": offset},
            )
            resp.raise_for_status()
            return resp.json()

    # --- CLOB API ---

    async def get_midpoint(self, token_id: str) -> float | None:
        """Get midpoint price from CLOB API."""
        try:
            async with _clob_semaphore:
                resp = await self.http.get(
                    f"{settings.POLYMARKET_CLOB_API}/midpoint",
                    params={"token_id": token_id},
                )
                resp.raise_for_status()
                data = resp.json()
                mid = data.get("mid")
                return float(mid) if mid is not None else None
        except (httpx.HTTPError, ValueError) as e:
            logger.warning("Failed to get midpoint for %s: %s", token_id, e)
            return None

    async def get_price(self, token_id: str, side: str = "buy") -> float | None:
        """Get buy/sell price from CLOB API."""
        try:
            async with _clob_semaphore:
                resp = await self.http.get(
                    f"{settings.POLYMARKET_CLOB_API}/price",
                    params={"token_id": token_id, "side": side},
                )
                resp.raise_for_status()
                data = resp.json()
                price = data.get("price")
                return float(price) if price is not None else None
        except (httpx.HTTPError, ValueError) as e:
            logger.warning("Failed to get %s price for %s: %s", side, token_id, e)
            return None

    async def get_orderbook(self, token_id: str) -> dict | None:
        """Get orderbook from CLOB API."""
        try:
            async with _clob_semaphore:
                resp = await self.http.get(
                    f"{settings.POLYMARKET_CLOB_API}/book",
                    params={"token_id": token_id},
                )
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as e:
            logger.warning("Failed to get orderbook for %s: %s", token_id, e)
            return None

    # --- Authenticated CLOB API ---

    @staticmethod
    def _build_auth_headers(
        api_key: str,
        api_secret: str,
        passphrase: str,
    ) -> dict[str, str]:
        """Build HMAC auth headers for Polymarket CLOB API.

        Polymarket uses L2 API key auth with HMAC-SHA256 signing.
        """
        timestamp = str(int(time.time()))
        nonce = str(int(time.time() * 1000))

        # HMAC signature: timestamp + nonce
        message = timestamp + nonce
        signature = hmac.new(
            api_secret.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()

        return {
            "POLY_ADDRESS": api_key,
            "POLY_SIGNATURE": signature,
            "POLY_TIMESTAMP": timestamp,
            "POLY_NONCE": nonce,
            "POLY_API_KEY": api_key,
            "POLY_PASSPHRASE": passphrase,
        }

    async def get_user_positions(
        self,
        *,
        wallet_address: str,
        size_threshold: float = 0.0,
        limit: int = 500,
    ) -> list[dict]:
        """Fetch user's positions from public Polymarket Data API.

        The Data API is public — no auth needed, just pass the wallet address.
        Docs: https://docs.polymarket.com/developers/misc-endpoints/data-api-get-positions

        Returns list of dicts with: asset, conditionId, size, avgPrice,
        curPrice, cashPnl, realizedPnl, outcome, title, slug, etc.
        """
        all_positions: list[dict] = []
        offset = 0

        try:
            while True:
                params: dict = {
                    "user": wallet_address,
                    "limit": limit,
                    "offset": offset,
                }
                if size_threshold > 0:
                    params["sizeThreshold"] = size_threshold

                async with _gamma_semaphore:
                    resp = await self.http.get(
                        f"{settings.POLYMARKET_DATA_API}/positions",
                        params=params,
                    )
                    resp.raise_for_status()
                    data = resp.json()

                # Response is a list of position objects
                batch = data if isinstance(data, list) else []
                all_positions.extend(batch)

                # If we got fewer than limit, we've fetched everything
                if len(batch) < limit:
                    break
                offset += limit

        except httpx.HTTPError as e:
            logger.warning("Failed to fetch positions for %s: %s", wallet_address, e)

        return all_positions

    async def get_usdc_balance(self, *, wallet_address: str) -> float:
        """Get USDC.e balance for a wallet on Polygon via public RPC.

        Polymarket uses USDC.e (PoS bridged) on Polygon.
        Contract: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 (6 decimals).
        """
        usdc_contract = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
        # balanceOf(address) selector = 0x70a08231
        addr_padded = wallet_address.lower().replace("0x", "").zfill(64)
        call_data = f"0x70a08231{addr_padded}"

        rpc_url = "https://polygon-bor-rpc.publicnode.com"
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_call",
            "params": [
                {"to": usdc_contract, "data": call_data},
                "latest",
            ],
            "id": 1,
        }

        try:
            resp = await self.http.post(rpc_url, json=payload)
            resp.raise_for_status()
            result = resp.json().get("result", "0x0")
            raw = int(result, 16)
            balance = raw / 1e6  # USDC has 6 decimals
            return balance
        except Exception as e:
            logger.warning("Failed to fetch USDC balance for %s: %s", wallet_address, e)
            return 0.0

    async def get_user_orders(
        self,
        *,
        api_key: str,
        api_secret: str,
        passphrase: str,
        status: str | None = None,
    ) -> list[dict]:
        """Fetch user's order history from authenticated Data API.

        Returns list of dicts with: id, market, asset, side, size, price,
        size_matched, status, created_at, outcome, type, etc.
        """
        try:
            headers = self._build_auth_headers(api_key, api_secret, passphrase)
            params: dict = {}
            if status:
                params["state"] = status.upper()
            async with _clob_semaphore:
                resp = await self.http.get(
                    f"{settings.POLYMARKET_DATA_API}/orders",
                    headers=headers,
                    params=params,
                )
                resp.raise_for_status()
                data = resp.json()
                # API may return { "orders": [...] } or just a list
                if isinstance(data, dict):
                    return data.get("orders", data.get("data", []))
                return data if isinstance(data, list) else []
        except httpx.HTTPError as e:
            logger.warning("Failed to fetch user orders: %s", e)
            return []

    async def get_user_balances(
        self,
        *,
        api_key: str,
        api_secret: str,
        passphrase: str,
    ) -> list[dict]:
        """Fetch user's token balances from authenticated CLOB API."""
        try:
            headers = self._build_auth_headers(api_key, api_secret, passphrase)
            async with _clob_semaphore:
                resp = await self.http.get(
                    f"{settings.POLYMARKET_DATA_API}/balances",
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, dict):
                    return data.get("balances", data.get("data", []))
                return data if isinstance(data, list) else []
        except httpx.HTTPError as e:
            logger.warning("Failed to fetch user balances: %s", e)
            return []


# Module-level singleton
polymarket_client = PolymarketClient()
