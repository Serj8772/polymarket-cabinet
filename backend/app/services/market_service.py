"""Market service — business logic for market data."""

import json
import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.market import market_crud
from app.schemas.market import (
    MarketDetailResponse,
    MarketListResponse,
    MarketResponse,
    MarketSearchParams,
)
from app.services.polymarket_client import polymarket_client
from app.utils.redis_client import get_redis

logger = logging.getLogger(__name__)

CACHE_PREFIX = "pm:markets"
CACHE_TTL = 300  # 5 minutes


class MarketService:
    """Service for market data operations."""

    async def get_markets(
        self,
        db: AsyncSession,
        *,
        params: MarketSearchParams,
    ) -> MarketListResponse:
        """Get paginated, filtered market list from DB."""
        skip = (params.page - 1) * params.page_size

        # If search query — use search path
        if params.q:
            return await self.search_markets(
                db,
                query=params.q,
                page=params.page,
                page_size=params.page_size,
            )

        # Try Redis cache for list queries
        cache_key = f"{CACHE_PREFIX}:list:{params.category}:{params.active}:{params.closed}:{params.page}:{params.page_size}"
        redis = get_redis()
        if redis:
            cached = await redis.get(cache_key)
            if cached:
                return MarketListResponse.model_validate_json(cached)

        # Query DB
        markets = await market_crud.get_multi_filtered(
            db,
            category=params.category,
            active=params.active,
            closed=params.closed,
            skip=skip,
            limit=params.page_size,
        )
        total = await market_crud.count_filtered(
            db,
            category=params.category,
            active=params.active,
            closed=params.closed,
        )

        response = MarketListResponse(
            markets=[MarketResponse.model_validate(m) for m in markets],
            total=total,
            page=params.page,
            page_size=params.page_size,
        )

        # Cache result
        if redis:
            await redis.set(cache_key, response.model_dump_json(), ex=CACHE_TTL)

        return response

    async def get_market_detail(
        self,
        db: AsyncSession,
        *,
        market_id: str,
    ) -> MarketDetailResponse | None:
        """Get single market with live price data from CLOB API."""
        # Check cache
        cache_key = f"{CACHE_PREFIX}:detail:{market_id}"
        redis = get_redis()
        if redis:
            cached = await redis.get(cache_key)
            if cached:
                return MarketDetailResponse.model_validate_json(cached)

        # Get from DB
        market = await market_crud.get(db, record_id=market_id)
        if market is None:
            return None

        # Build base response
        base = MarketResponse.model_validate(market)
        detail = MarketDetailResponse(
            **base.model_dump(),
            best_bid=None,
            best_ask=None,
            midpoint=None,
        )

        # Enrich with live CLOB prices for first token
        if market.tokens and len(market.tokens) > 0:
            first_token = market.tokens[0]
            token_id = first_token.get("token_id")
            if token_id:
                midpoint = await polymarket_client.get_midpoint(token_id)
                bid = await polymarket_client.get_price(token_id, "buy")
                ask = await polymarket_client.get_price(token_id, "sell")
                detail.midpoint = midpoint
                detail.best_bid = bid
                detail.best_ask = ask

        # Cache
        if redis:
            await redis.set(cache_key, detail.model_dump_json(), ex=CACHE_TTL)

        return detail

    async def search_markets(
        self,
        db: AsyncSession,
        *,
        query: str,
        page: int = 1,
        page_size: int = 20,
    ) -> MarketListResponse:
        """Search markets by question text in DB."""
        skip = (page - 1) * page_size

        markets = await market_crud.search(
            db, query=query, skip=skip, limit=page_size,
        )
        total = await market_crud.count_filtered(db, query=query)

        return MarketListResponse(
            markets=[MarketResponse.model_validate(m) for m in markets],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def sync_markets_from_gamma(self, db: AsyncSession) -> int:
        """Sync all markets from Gamma API into PostgreSQL.

        Fetches pages of 100 until exhausted, upserts into markets table,
        and invalidates Redis list cache.
        """
        total_synced = 0
        offset = 0
        page_size = 100

        while True:
            try:
                raw_markets = await polymarket_client.get_markets(
                    limit=page_size, offset=offset,
                )
            except Exception as e:
                logger.error("Failed to fetch markets at offset %d: %s", offset, e)
                break

            if not raw_markets:
                break

            # Transform Gamma API response to our model format
            markets_data = []
            now = datetime.now(UTC)

            for m in raw_markets:
                market_id = m.get("condition_id") or m.get("id")
                question = m.get("question")
                if not market_id or not question:
                    continue

                # Parse tokens from clob_token_ids + outcomes
                tokens = self._parse_tokens(m)

                markets_data.append({
                    "id": str(market_id),
                    "question": question,
                    "slug": m.get("market_slug") or m.get("slug"),
                    "category": m.get("group_item_title") or m.get("category"),
                    "end_date": m.get("end_date_iso"),
                    "active": m.get("active", True),
                    "closed": m.get("closed", False),
                    "tokens": tokens,
                    "volume": self._parse_float(m.get("volume")),
                    "liquidity": self._parse_float(m.get("liquidity")),
                    "description": m.get("description"),
                    "image": m.get("image"),
                    "synced_at": now,
                })

            if markets_data:
                count = await market_crud.upsert_many(db, markets_data=markets_data)
                total_synced += count

            offset += page_size

            # Stop if we got fewer than a full page
            if len(raw_markets) < page_size:
                break

        # Invalidate Redis list cache
        redis = get_redis()
        if redis and total_synced > 0:
            keys = await redis.keys(f"{CACHE_PREFIX}:*")
            if keys:
                await redis.delete(*keys)
                logger.info("Invalidated %d cache keys", len(keys))

        return total_synced

    @staticmethod
    def _parse_tokens(market_data: dict) -> list[dict] | None:
        """Parse token info from Gamma API market data."""
        tokens = []

        # Gamma API provides clob_token_ids (comma-separated) and outcomes
        clob_ids = market_data.get("clob_token_ids")
        outcomes_str = market_data.get("outcomes")

        if clob_ids and outcomes_str:
            try:
                token_ids = json.loads(clob_ids) if isinstance(clob_ids, str) else clob_ids
                outcomes = json.loads(outcomes_str) if isinstance(outcomes_str, str) else outcomes_str

                # Try to get prices from outcomePrices
                prices_str = market_data.get("outcomePrices")
                prices = []
                if prices_str:
                    prices = json.loads(prices_str) if isinstance(prices_str, str) else prices_str

                for i, token_id in enumerate(token_ids):
                    outcome = outcomes[i] if i < len(outcomes) else f"Outcome {i}"
                    price = float(prices[i]) if i < len(prices) else None
                    tokens.append({
                        "token_id": str(token_id),
                        "outcome": str(outcome),
                        "price": price,
                    })
            except (json.JSONDecodeError, ValueError, IndexError) as e:
                logger.debug("Failed to parse tokens: %s", e)
                return None

        return tokens if tokens else None

    @staticmethod
    def _parse_float(value: Any) -> float | None:
        """Safely parse float from API response."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None


market_service = MarketService()
