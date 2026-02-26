"""User CRUD operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.auth import PolymarketCredsRequest


class CRUDUser(CRUDBase[User, dict, dict]):
    """CRUD operations for User model."""

    async def get_by_wallet(
        self,
        db: AsyncSession,
        *,
        wallet_address: str,
    ) -> User | None:
        """Get user by wallet address (case-insensitive)."""
        result = await db.execute(
            select(User).where(
                User.wallet_address == wallet_address.lower()
            )
        )
        return result.scalar_one_or_none()

    async def get_or_create_by_wallet(
        self,
        db: AsyncSession,
        *,
        wallet_address: str,
    ) -> User:
        """Get existing user or create new one by wallet address."""
        user = await self.get_by_wallet(db, wallet_address=wallet_address)
        if user:
            return user

        return await self.create(
            db,
            obj_in={"wallet_address": wallet_address.lower()},
        )

    async def update_polymarket_creds(
        self,
        db: AsyncSession,
        *,
        user: User,
        encrypted_api_key: str,
        encrypted_api_secret: str,
        encrypted_passphrase: str,
    ) -> User:
        """Update user's encrypted Polymarket API credentials."""
        return await self.update(
            db,
            db_obj=user,
            obj_in={
                "encrypted_api_key": encrypted_api_key,
                "encrypted_api_secret": encrypted_api_secret,
                "encrypted_passphrase": encrypted_passphrase,
            },
        )

    async def update_proxy_wallet(
        self,
        db: AsyncSession,
        *,
        user: User,
        proxy_wallet: str,
    ) -> User:
        """Update user's Polymarket proxy wallet address."""
        return await self.update(
            db,
            db_obj=user,
            obj_in={"proxy_wallet": proxy_wallet.lower()},
        )


user_crud = CRUDUser(User)
