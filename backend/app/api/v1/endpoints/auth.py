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
    PrivateKeyRequest,
    ProxyWalletRequest,
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

    # 1. Atomically retrieve and delete nonce (prevents race condition)
    nonce_key = f"{NONCE_PREFIX}{wallet}"
    stored_nonce = await redis.getdel(nonce_key)
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
        proxy_wallet=current_user.proxy_wallet,
        has_polymarket_creds=current_user.has_polymarket_creds,
        has_private_key=current_user.has_private_key,
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
        proxy_wallet=user.proxy_wallet,
        has_polymarket_creds=user.has_polymarket_creds,
        has_private_key=user.has_private_key,
    )


@router.post("/proxy-wallet", response_model=UserResponse)
async def save_proxy_wallet(
    body: ProxyWalletRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Save Polymarket proxy wallet address for current user.

    Polymarket deploys a proxy wallet (1-of-1 multisig on Polygon) for each
    user. Portfolio positions and USDC are held on this proxy wallet, not
    the user's EOA. Users can find their proxy address in Polymarket settings.
    """
    user = await user_crud.update_proxy_wallet(
        db,
        user=current_user,
        proxy_wallet=body.proxy_wallet,
    )

    logger.info("Proxy wallet saved for %s: %s", current_user.wallet_address[:10], body.proxy_wallet[:10])
    return UserResponse(
        wallet_address=user.wallet_address,
        proxy_wallet=user.proxy_wallet,
        has_polymarket_creds=user.has_polymarket_creds,
        has_private_key=user.has_private_key,
    )


@router.post("/private-key", response_model=UserResponse)
async def save_private_key(
    body: PrivateKeyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Save encrypted wallet private key for CLOB order signing.

    The private key is encrypted with Fernet before storage.
    After saving, automatically derives Polymarket API credentials
    via py-clob-client so the user doesn't need to enter them manually.
    """
    from py_clob_client.client import ClobClient
    from app.core.config import settings as app_settings

    # Normalize: strip 0x prefix if present
    pk = body.private_key.strip()
    if pk.startswith("0x"):
        pk = pk[2:]

    # Validate hex
    try:
        int(pk, 16)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid private key format (must be hex)",
        )

    if len(pk) != 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid private key length (must be 32 bytes / 64 hex chars)",
        )

    # Save encrypted private key
    update_data: dict = {"encrypted_private_key": encrypt_value(pk)}

    # Auto-derive Polymarket API credentials from private key
    try:
        client = ClobClient(
            host=app_settings.POLYMARKET_CLOB_API,
            chain_id=137,
            key=pk,
            signature_type=2,
            funder=current_user.wallet_address,
        )
        creds = client.create_or_derive_api_creds()
        if creds:
            update_data["encrypted_api_key"] = encrypt_value(creds.api_key)
            update_data["encrypted_api_secret"] = encrypt_value(creds.api_secret)
            update_data["encrypted_passphrase"] = encrypt_value(creds.api_passphrase)
            logger.info(
                "Auto-derived API creds for %s",
                current_user.wallet_address[:10],
            )
        else:
            logger.warning(
                "Could not derive API creds for %s",
                current_user.wallet_address[:10],
            )
    except Exception as e:
        logger.warning(
            "Failed to auto-derive API creds for %s: %s",
            current_user.wallet_address[:10],
            e,
        )

    user = await user_crud.update(
        db,
        db_obj=current_user,
        obj_in=update_data,
    )

    logger.info("Private key saved for %s", current_user.wallet_address[:10])
    return UserResponse(
        wallet_address=user.wallet_address,
        proxy_wallet=user.proxy_wallet,
        has_polymarket_creds=user.has_polymarket_creds,
        has_private_key=user.has_private_key,
    )
