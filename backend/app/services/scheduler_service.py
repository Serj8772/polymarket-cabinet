"""Background task scheduler using APScheduler.

IMPORTANT: When running with multiple Uvicorn workers (--workers N),
each worker starts its own scheduler. We use a file lock to ensure
only ONE worker runs the scheduler, preventing duplicate job execution.
"""

import logging
import os
import tempfile

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.db.session import async_session_maker
from app.services.market_service import market_service

logger = logging.getLogger(__name__)

scheduler: AsyncIOScheduler | None = None
_lock_fd: int | None = None

LOCK_FILE = os.path.join(tempfile.gettempdir(), "polymarket_scheduler.lock")


def _acquire_scheduler_lock() -> bool:
    """Try to acquire an exclusive file lock for the scheduler.

    Returns True if this process should run the scheduler.
    Only one worker will succeed; others will skip scheduler startup.
    """
    global _lock_fd
    try:
        import fcntl

        _lock_fd = os.open(LOCK_FILE, os.O_CREAT | os.O_RDWR)
        fcntl.flock(_lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except (OSError, BlockingIOError):
        if _lock_fd is not None:
            os.close(_lock_fd)
            _lock_fd = None
        return False


def _release_scheduler_lock() -> None:
    """Release the scheduler file lock."""
    global _lock_fd
    if _lock_fd is not None:
        try:
            import fcntl

            fcntl.flock(_lock_fd, fcntl.LOCK_UN)
            os.close(_lock_fd)
        except OSError:
            pass
        _lock_fd = None


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
    """Start the background scheduler with all jobs.

    Uses file locking so only one worker starts the scheduler
    when running with multiple Uvicorn workers.
    """
    global scheduler

    if not _acquire_scheduler_lock():
        logger.info("Another worker owns the scheduler — skipping")
        return

    scheduler = AsyncIOScheduler()

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
    global scheduler
    if scheduler is not None:
        scheduler.shutdown(wait=False)
        scheduler = None
        logger.info("Background scheduler stopped")
    _release_scheduler_lock()
