"""Auth request/response schemas."""

from pydantic import BaseModel, Field


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


class UserResponse(BaseModel):
    """User info response."""

    wallet_address: str
    has_polymarket_creds: bool

    class Config:
        from_attributes = True
