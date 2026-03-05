"""Arbitrage scanner — finds tail-collecting opportunities in multi-bracket events."""

import logging
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.market import Market

logger = logging.getLogger(__name__)


class BracketInfo:
    """Single bracket within a multi-outcome event."""

    __slots__ = (
        "market_id", "question", "yes_price", "no_price",
        "is_tail", "profit_pct", "token_id_yes", "token_id_no",
    )

    def __init__(
        self,
        *,
        market_id: str,
        question: str,
        yes_price: float,
        token_id_yes: str | None = None,
        token_id_no: str | None = None,
        tail_threshold: float = 0.10,
    ):
        self.market_id = market_id
        self.question = question
        self.yes_price = yes_price
        self.no_price = round(1.0 - yes_price, 4)
        self.is_tail = yes_price < tail_threshold
        self.profit_pct = round((1.0 / self.no_price - 1.0) * 100, 2) if self.no_price > 0 else 0.0
        self.token_id_yes = token_id_yes
        self.token_id_no = token_id_no


class ArbitrageOpportunity:
    """Multi-bracket event with arbitrage metrics."""

    __slots__ = (
        "event_slug", "event_title", "image", "brackets",
        "sum_yes", "overround", "tail_count", "best_tail_profit",
    )

    def __init__(
        self,
        *,
        event_slug: str,
        event_title: str,
        image: str | None,
        brackets: list[BracketInfo],
    ):
        self.event_slug = event_slug
        self.event_title = event_title
        self.image = image
        self.brackets = brackets
        self.sum_yes = round(sum(b.yes_price for b in brackets), 4)
        self.overround = round(self.sum_yes - 1.0, 4)
        self.tail_count = sum(1 for b in brackets if b.is_tail)
        tail_profits = [b.profit_pct for b in brackets if b.is_tail]
        self.best_tail_profit = max(tail_profits) if tail_profits else 0.0


class ArbitrageService:
    """Scans multi-bracket events for tail-collecting opportunities."""

    async def scan_opportunities(
        self,
        db: AsyncSession,
        *,
        tail_threshold: float = 0.10,
        min_brackets: int = 3,
    ) -> list[ArbitrageOpportunity]:
        """Find multi-bracket events with tails below threshold.

        Args:
            tail_threshold: Maximum YES price to consider a bracket a "tail" (default 10%).
            min_brackets: Minimum number of brackets in an event (default 3).

        Returns:
            List of opportunities sorted by best_tail_profit descending.
        """
        # Fetch all active markets with event_slug
        result = await db.execute(
            select(Market)
            .where(Market.event_slug.isnot(None))
            .where(Market.active == True)  # noqa: E712
            .where(Market.closed == False)  # noqa: E712
        )
        markets = list(result.scalars().all())

        # Group by event_slug
        groups: dict[str, list[Market]] = defaultdict(list)
        for m in markets:
            groups[m.event_slug].append(m)  # type: ignore[arg-type]

        opportunities: list[ArbitrageOpportunity] = []

        for slug, event_markets in groups.items():
            if len(event_markets) < min_brackets:
                continue

            brackets: list[BracketInfo] = []
            for m in event_markets:
                yes_price, tid_yes, tid_no = self._extract_yes_price(m)
                if yes_price is None:
                    continue

                brackets.append(BracketInfo(
                    market_id=m.id,
                    question=m.question,
                    yes_price=yes_price,
                    token_id_yes=tid_yes,
                    token_id_no=tid_no,
                    tail_threshold=tail_threshold,
                ))

            if len(brackets) < min_brackets:
                continue

            opp = ArbitrageOpportunity(
                event_slug=slug,
                event_title=event_markets[0].question.split(" - ")[0]
                if " - " in event_markets[0].question
                else event_markets[0].category or slug,
                image=event_markets[0].image,
                brackets=sorted(brackets, key=lambda b: b.yes_price),
            )

            # Only include if there are tails
            if opp.tail_count > 0:
                opportunities.append(opp)

        # Sort by best tail profit descending
        opportunities.sort(key=lambda o: o.best_tail_profit, reverse=True)
        return opportunities[:50]

    @staticmethod
    def _extract_yes_price(market: Market) -> tuple[float | None, str | None, str | None]:
        """Extract YES price and token IDs from market tokens JSONB.

        Returns:
            (yes_price, token_id_yes, token_id_no)
        """
        if not market.tokens or not isinstance(market.tokens, list):
            return None, None, None

        tid_yes = None
        tid_no = None
        yes_price = None

        for token in market.tokens:
            outcome = str(token.get("outcome", "")).lower()
            if outcome == "yes":
                yes_price = token.get("price")
                tid_yes = token.get("token_id")
            elif outcome == "no":
                tid_no = token.get("token_id")

        if yes_price is None:
            return None, None, None

        try:
            return float(yes_price), tid_yes, tid_no
        except (ValueError, TypeError):
            return None, None, None


arbitrage_service = ArbitrageService()
