"""FastAPI application entry point."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.base import Base
from app.db.session import engine
from app.middleware.error_handler import setup_error_handlers
from app.models.market import Market  # noqa: F401
from app.models.price_snapshot import PriceSnapshot  # noqa: F401
from app.models.user import User  # noqa: F401
from app.services.polymarket_client import polymarket_client
from app.services.scheduler_service import start_scheduler, stop_scheduler
from app.utils.redis_client import close_redis, init_redis

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup and shutdown events."""
    # Startup
    logger.info("Starting %s v%s", settings.PROJECT_NAME, settings.VERSION)
    await init_redis()
    await polymarket_client.start()

    # Auto-create tables in development (use Alembic migrations in production)
    if not settings.is_production:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created (dev mode)")

    # Start background scheduler (market sync every 10 min)
    start_scheduler()

    logger.info("Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down...")
    stop_scheduler()
    await polymarket_client.close()
    await close_redis()
    await engine.dispose()
    logger.info("Application stopped")


# Create FastAPI application
# Disable OpenAPI docs in production to avoid exposing API surface
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=None if settings.is_production else f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=None if settings.is_production else f"{settings.API_V1_PREFIX}/docs",
    redoc_url=None if settings.is_production else f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Error handlers
setup_error_handlers(app)

# API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }
