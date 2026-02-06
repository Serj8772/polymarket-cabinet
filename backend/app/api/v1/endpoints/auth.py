"""Web3 authentication endpoints."""

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import (
    create_access_token,
    encrypt_value,
    verify_wallet_signature,
)
from app.crud.user import user_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    NonceResponse,
    PolymarketCredsRequest,
    TokenResponse,
    UserResponse,
)
from app.utils.redis_client import get_redis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

NONCE_PREFIX = "pm:nonce:"
NONCE_TTL = 300  # 5 minutes


@router.get("/nonce", response_model=NonceResponse)
async def get_nonce(wallet: str) -> NonceResponse:
    """Generate authentication nonce for wallet to sign.

    The nonce is stored in Redis with a 5-minute TTL.
    """
    # Validate wallet format
    if not wallet.startswith("0x") or len(wallet) != 42:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid wallet address format",
        )

    nonce = secrets.token_hex(16)
    message = f"Sign this message to authenticate with Polymarket Cabinet.\n\nNonce: {nonce}"

    redis = get_redis()
    await redis.set(f"{NONCE_PREFIX}{wallet.lower()}", nonce, ex=NONCE_TTL)

    logger.info("Nonce generated for wallet %s", wallet[:10])
    return NonceResponse(nonce=nonce, message=message)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Verify wallet signature and issue JWT token.

    Flow:
    1. Retrieve stored nonce from Redis
    2. Reconstruct the message
    3. Verify the signature matches the wallet
    4. Create/find user in DB
    5. Issue JWT token
    """
    redis = get_redis()
    wallet = body.wallet.lower()

    # 1. Check nonce exists and matches
    stored_nonce = await redis.get(f"{NONCE_PREFIX}{wallet}")
    if stored_nonce is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nonce expired or not found. Request a new one.",
        )

    if stored_nonce != body.nonce:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid nonce",
        )

    # 2. Reconstruct message
    message = f"Sign this message to authenticate with Polymarket Cabinet.\n\nNonce: {body.nonce}"

    # 3. Verify signature
    is_valid = verify_wallet_signature(wallet, message, body.signature)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature",
        )

    # 4. Invalidate nonce (one-time use)
    await redis.delete(f"{NONCE_PREFIX}{wallet}")

    # 5. Get or create user
    user = await user_crud.get_or_create_by_wallet(db, wallet_address=wallet)

    # 6. Issue JWT
    access_token = create_access_token(subject=user.wallet_address)

    logger.info("User logged in: %s", wallet[:10])
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current authenticated user info."""
    return UserResponse(
        wallet_address=current_user.wallet_address,
        has_polymarket_creds=current_user.has_polymarket_creds,
    )


@router.post("/polymarket-creds", response_model=UserResponse)
async def save_polymarket_creds(
    body: PolymarketCredsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Save encrypted Polymarket L2 API credentials for current user."""
    user = await user_crud.update_polymarket_creds(
        db,
        user=current_user,
        encrypted_api_key=encrypt_value(body.api_key),
        encrypted_api_secret=encrypt_value(body.api_secret),
        encrypted_passphrase=encrypt_value(body.passphrase),
    )

    logger.info("Polymarket creds saved for %s", current_user.wallet_address[:10])
    return UserResponse(
        wallet_address=user.wallet_address,
        has_polymarket_creds=user.has_polymarket_creds,
    )
