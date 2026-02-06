"""API v1 main router."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth

api_router = APIRouter()

api_router.include_router(auth.router)

# Future endpoints will be added here:
# api_router.include_router(markets.router)
# api_router.include_router(portfolio.router)
# api_router.include_router(orders.router)
# api_router.include_router(charts.router)
