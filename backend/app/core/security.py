"""Security utilities: JWT tokens, signature verification, encryption."""

from datetime import UTC, datetime, timedelta

import jwt
from cryptography.fernet import Fernet
from eth_account import Account
from eth_account.messages import encode_defunct

from app.core.config import settings

# --- JWT ---

def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create JWT access token.

    Args:
        subject: Token subject (wallet address).
        expires_delta: Custom expiration time.

    Returns:
        Encoded JWT string.
    """
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES))

    payload = {
        "sub": subject,
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    """Decode and validate JWT access token.

    Args:
        token: JWT token string.

    Returns:
        Decoded payload dict.

    Raises:
        jwt.ExpiredSignatureError: If token has expired.
        jwt.InvalidTokenError: If token is invalid.
    """
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=["HS256"],
    )


# --- Web3 Signature Verification ---

def verify_wallet_signature(
    wallet_address: str,
    message: str,
    signature: str,
) -> bool:
    """Verify that a message was signed by the given wallet address.

    Args:
        wallet_address: Expected signer address (0x...).
        message: Original message that was signed.
        signature: Hex-encoded signature.

    Returns:
        True if the signature is valid and matches the wallet address.
    """
    try:
        msg = encode_defunct(text=message)
        recovered = Account.recover_message(msg, signature=signature)
        return recovered.lower() == wallet_address.lower()
    except Exception:
        return False


# --- Fernet Encryption for API Credentials ---

def _get_fernet() -> Fernet:
    """Get Fernet instance for credential encryption."""
    return Fernet(settings.FERNET_KEY.encode())


def encrypt_value(value: str) -> str:
    """Encrypt a string value using Fernet symmetric encryption.

    Args:
        value: Plain text value to encrypt.

    Returns:
        Encrypted value as a string.
    """
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt_value(encrypted_value: str) -> str:
    """Decrypt a Fernet-encrypted string.

    Args:
        encrypted_value: Encrypted value string.

    Returns:
        Decrypted plain text value.
    """
    return _get_fernet().decrypt(encrypted_value.encode()).decode()
