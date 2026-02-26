"""Auth request/response schemas."""

from pydantic import BaseModel, ConfigDict, Field


class NonceRequest(BaseModel):
    """Request for authentication nonce."""

    wallet: str = Field(
        ...,
        min_length=42,
        max_length=42,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Ethereum wallet address",
        examples=["0x1234567890abcdef1234567890abcdef12345678"],
    )


class NonceResponse(BaseModel):
    """Response with nonce for signing."""

    nonce: str
    message: str = Field(
        ...,
        description="Full message to sign in MetaMask",
    )


class LoginRequest(BaseModel):
    """Login request with signed message."""

    wallet: str = Field(
        ...,
        min_length=42,
        max_length=42,
        pattern=r"^0x[a-fA-F0-9]{40}$",
    )
    signature: str = Field(
        ...,
        description="Hex-encoded signature from MetaMask",
    )
    nonce: str = Field(
        ...,
        description="Original nonce that was signed",
    )


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class PolymarketCredsRequest(BaseModel):
    """Request to save Polymarket L2 API credentials."""

    api_key: str = Field(..., description="Polymarket API key (UUID)")
    api_secret: str = Field(..., description="Polymarket API secret (base64)")
    passphrase: str = Field(..., description="Polymarket API passphrase")


class ProxyWalletRequest(BaseModel):
    """Request to save Polymarket proxy wallet address."""

    proxy_wallet: str = Field(
        ...,
        min_length=42,
        max_length=42,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Polymarket proxy wallet address (found in polymarket.com profile)",
        examples=["0x33492472B98A2a881848B3DeFf4dB7CB91f167f2"],
    )


class PrivateKeyRequest(BaseModel):
    """Request to save wallet private key for trading."""

    private_key: str = Field(
        ...,
        min_length=64,
        max_length=66,
        description="Wallet private key (hex, with or without 0x prefix)",
    )


class UserResponse(BaseModel):
    """User info response."""

    model_config = ConfigDict(from_attributes=True)

    wallet_address: str
    proxy_wallet: str | None = None
    has_polymarket_creds: bool
    has_private_key: bool = False
