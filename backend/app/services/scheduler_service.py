"""Background task scheduler using APScheduler."""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.db.session import async_session_maker
from app.services.market_service import market_service

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def sync_markets_job() -> None:
    """Background job: sync markets from Gamma API every 10 minutes."""
    async with async_session_maker() as db:
        try:
            count = await market_service.sync_markets_from_gamma(db)
            logger.info("Synced %d markets from Gamma API", count)
        except Exception:
            logger.exception("Failed to sync markets")


async def check_stop_losses_job() -> None:
    """Background job: check stop loss triggers every 30 seconds."""
    from app.services.trading_service import trading_service

    async with async_session_maker() as db:
        try:
            triggered = await trading_service.check_stop_losses(db)
            if triggered:
                logger.info("Stop loss check: %d positions triggered", triggered)
        except Exception:
            logger.exception("Failed to check stop losses")


def start_scheduler() -> None:
    """Start the background scheduler with all jobs."""
    scheduler.add_job(
        sync_markets_job,
        "interval",
        minutes=10,
        id="sync_markets",
        replace_existing=True,
    )
    # Run first sync immediately on startup
    scheduler.add_job(
        sync_markets_job,
        id="sync_markets_initial",
        replace_existing=True,
    )

    # Stop loss monitoring — every 30 seconds
    scheduler.add_job(
        check_stop_losses_job,
        "interval",
        seconds=30,
        id="check_stop_losses",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Background scheduler started (markets: 10min, SL monitor: 30s)")


def stop_scheduler() -> None:
    """Stop the background scheduler."""
    scheduler.shutdown(wait=False)
    logger.info("Background scheduler stopped")
