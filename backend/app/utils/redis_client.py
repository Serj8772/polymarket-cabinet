"""Async Redis client utility."""

import logging

from redis.asyncio import Redis

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Redis instance (initialized in lifespan)
redis: Redis | None = None


async def init_redis() -> Redis:
    """Initialize async Redis connection."""
    global redis
    redis = Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        max_connections=20,
    )
    # Test connection
    await redis.ping()
    logger.info("Redis connection established")
    return redis


async def close_redis() -> None:
    """Close Redis connection."""
    global redis
    if redis:
        await redis.close()
        redis = None
        logger.info("Redis connection closed")


def get_redis() -> Redis:
    """Get Redis instance. Raises if not initialized."""
    if redis is None:
        raise RuntimeError("Redis is not initialized. Call init_redis() first.")
    return redis
