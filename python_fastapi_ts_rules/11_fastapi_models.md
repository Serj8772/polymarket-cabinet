# FastAPI Models - Модели и ORM

## Общие принципы

- **SQLAlchemy** для ORM моделей (БД)
- **Pydantic** для валидации и сериализации
- **Разделяйте** модели БД и Pydantic схемы
- **Type hints** для всех полей

## SQLAlchemy Models

### Базовая модель
```python
# ✅ ПРАВИЛЬНО - современный SQLAlchemy 2.0 стиль
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    """User model."""
    
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Optional fields
    full_name: Mapped[str | None] = mapped_column(String(100))
    
    # Booleans
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"
```

### Relationships
```python
# ✅ ПРАВИЛЬНО - отношения между моделями
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class User(Base, TimestampMixin):
    """User with posts relationship."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    
    # One-to-Many: User -> Posts
    posts: Mapped[list["Post"]] = relationship(
        "Post",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    
    # One-to-One: User -> Profile
    profile: Mapped["Profile"] = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

class Post(Base, TimestampMixin):
    """Post model."""
    
    __tablename__ = "posts"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str]
    
    # Foreign key
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Relationship
    author: Mapped["User"] = relationship("User", back_populates="posts")

class Profile(Base, TimestampMixin):
    """User profile (one-to-one)."""
    
    __tablename__ = "profiles"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    bio: Mapped[str | None]
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    
    # Foreign key with unique constraint for one-to-one
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    
    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="profile")
```

### Many-to-Many Relationships
```python
# ✅ ПРАВИЛЬНО - many-to-many через ассоциативную таблицу
from sqlalchemy import Table, Column, Integer, ForeignKey

# Association table
user_role = Table(
    "user_role",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"))
)

class User(Base):
    """User with roles."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    
    # Many-to-Many
    roles: Mapped[list["Role"]] = relationship(
        "Role",
        secondary=user_role,
        back_populates="users"
    )

class Role(Base):
    """Role model."""
    
    __tablename__ = "roles"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str | None]
    
    # Many-to-Many
    users: Mapped[list["User"]] = relationship(
        "User",
        secondary=user_role,
        back_populates="roles"
    )
```

### Индексы и ограничения
```python
# ✅ ПРАВИЛЬНО - индексы и constraint
from sqlalchemy import Index, UniqueConstraint, CheckConstraint

class User(Base):
    """User with indexes."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255))
    username: Mapped[str] = mapped_column(String(50))
    age: Mapped[int | None]
    
    # Table-level constraints
    __table_args__ = (
        # Composite index
        Index("idx_user_email_username", "email", "username"),
        
        # Unique constraint
        UniqueConstraint("email", "username", name="uq_email_username"),
        
        # Check constraint
        CheckConstraint("age >= 0 AND age <= 150", name="check_age_range"),
    )
```

### Enum поля
```python
# ✅ ПРАВИЛЬНО - использование Enum
from enum import Enum as PyEnum
from sqlalchemy import Enum as SQLEnum

class UserStatus(str, PyEnum):
    """User status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    BANNED = "banned"

class User(Base):
    """User with enum status."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    
    # Enum field
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus),
        default=UserStatus.ACTIVE,
        nullable=False
    )
```

### JSON поля
```python
# ✅ ПРАВИЛЬНО - JSON поля для PostgreSQL
from sqlalchemy.dialects.postgresql import JSONB

class User(Base):
    """User with JSON metadata."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    
    # JSON field
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
    preferences: Mapped[dict | None] = mapped_column(JSONB)
```

## Pydantic Schemas

### Базовые схемы
```python
# ✅ ПРАВИЛЬНО - иерархия Pydantic схем
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str | None = None
    is_active: bool = True

class UserCreate(UserBase):
    """Schema for user creation."""
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    """Schema for user update (all fields optional)."""
    email: EmailStr | None = None
    username: str | None = Field(None, min_length=3, max_length=50)
    full_name: str | None = None
    password: str | None = Field(None, min_length=8, max_length=100)

class UserInDB(UserBase):
    """Schema for user in database."""
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserResponse(UserBase):
    """Schema for user response (без пароля)."""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

### Вложенные схемы
```python
# ✅ ПРАВИЛЬНО - вложенные объекты
from pydantic import BaseModel

class PostBase(BaseModel):
    """Base post schema."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str

class PostCreate(PostBase):
    """Schema for post creation."""
    pass

class PostResponse(PostBase):
    """Post response with author."""
    id: int
    author_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserWithPosts(UserResponse):
    """User response with posts."""
    posts: list[PostResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
```

### Валидаторы
```python
# ✅ ПРАВИЛЬНО - custom validators
from pydantic import BaseModel, validator, field_validator

class UserCreate(BaseModel):
    """User creation with validation."""
    username: str
    email: EmailStr
    password: str
    age: int | None = None
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v.lower()
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain digit")
        return v
    
    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int | None) -> int | None:
        """Validate age range."""
        if v is not None and (v < 0 or v > 150):
            raise ValueError("Age must be between 0 and 150")
        return v
```

### Root validators
```python
# ✅ ПРАВИЛЬНО - root validator для связанных полей
from pydantic import BaseModel, model_validator

class DateRange(BaseModel):
    """Date range with validation."""
    start_date: datetime
    end_date: datetime
    
    @model_validator(mode='after')
    def validate_date_range(self) -> 'DateRange':
        """Validate that end_date is after start_date."""
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self

class UserUpdate(BaseModel):
    """User update with password validation."""
    current_password: str | None = None
    new_password: str | None = None
    
    @model_validator(mode='after')
    def validate_password_change(self) -> 'UserUpdate':
        """Validate password change fields."""
        if self.new_password and not self.current_password:
            raise ValueError(
                "current_password required when changing password"
            )
        return self
```

## CRUD Operations

### Базовый CRUD
```python
# ✅ ПРАВИЛЬНО - CRUD для конкретной модели
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """CRUD operations for User model."""
    
    async def get_by_email(
        self,
        db: AsyncSession,
        *,
        email: str
    ) -> User | None:
        """Get user by email."""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_username(
        self,
        db: AsyncSession,
        *,
        username: str
    ) -> User | None:
        """Get user by username."""
        result = await db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()
    
    async def get_active_users(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> list[User]:
        """Get active users."""
        result = await db.execute(
            select(User)
            .where(User.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

user_crud = CRUDUser(User)
```

### Сложные запросы
```python
# ✅ ПРАВИЛЬНО - запросы с join и фильтрацией
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

async def get_user_with_posts(
    db: AsyncSession,
    user_id: int
) -> User | None:
    """Get user with posts (eager loading)."""
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.posts))
    )
    return result.scalar_one_or_none()

async def search_users(
    db: AsyncSession,
    *,
    query: str,
    skip: int = 0,
    limit: int = 100
) -> list[User]:
    """Search users by username or email."""
    result = await db.execute(
        select(User)
        .where(
            or_(
                User.username.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%")
            )
        )
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_users_with_filters(
    db: AsyncSession,
    *,
    is_active: bool | None = None,
    is_superuser: bool | None = None,
    skip: int = 0,
    limit: int = 100
) -> list[User]:
    """Get users with dynamic filters."""
    filters = []
    
    if is_active is not None:
        filters.append(User.is_active == is_active)
    
    if is_superuser is not None:
        filters.append(User.is_superuser == is_superuser)
    
    result = await db.execute(
        select(User)
        .where(and_(*filters) if filters else True)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
```

## Pagination

### Pagination схема
```python
# ✅ ПРАВИЛЬНО - универсальная пагинация
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int
    
    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int
    ) -> "PaginatedResponse[T]":
        """Create paginated response."""
        pages = (total + page_size - 1) // page_size
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )

# Использование
async def get_users_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10
) -> PaginatedResponse[UserResponse]:
    """Get paginated users."""
    skip = (page - 1) * page_size
    
    # Get items
    result = await db.execute(
        select(User).offset(skip).limit(page_size)
    )
    items = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(User)
    )
    total = count_result.scalar()
    
    return PaginatedResponse.create(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )
```

## Soft Delete

### Soft delete модель
```python
# ✅ ПРАВИЛЬНО - soft delete с миксином
from datetime import datetime
from sqlalchemy import DateTime

class SoftDeleteMixin:
    """Mixin for soft delete functionality."""
    
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    @property
    def is_deleted(self) -> bool:
        """Check if record is deleted."""
        return self.deleted_at is not None

class User(Base, TimestampMixin, SoftDeleteMixin):
    """User with soft delete."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))

# CRUD с soft delete
class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """User CRUD with soft delete."""
    
    async def get_active(
        self,
        db: AsyncSession,
        id: int
    ) -> User | None:
        """Get non-deleted user."""
        result = await db.execute(
            select(User)
            .where(User.id == id)
            .where(User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()
    
    async def soft_delete(
        self,
        db: AsyncSession,
        *,
        id: int
    ) -> User:
        """Soft delete user."""
        user = await self.get(db, id=id)
        user.deleted_at = datetime.utcnow()
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    async def restore(
        self,
        db: AsyncSession,
        *,
        id: int
    ) -> User:
        """Restore soft-deleted user."""
        user = await self.get(db, id=id)
        user.deleted_at = None
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
```

## Model Mixins

### Полезные миксины
```python
# ✅ ПРАВИЛЬНО - переиспользуемые миксины
from datetime import datetime
from sqlalchemy import DateTime, func, String
from sqlalchemy.orm import Mapped, mapped_column

class IdMixin:
    """Primary key mixin."""
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

class TimestampMixin:
    """Created and updated timestamp mixin."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class SoftDeleteMixin:
    """Soft delete mixin."""
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

class SlugMixin:
    """URL slug mixin."""
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

# Использование
class Post(Base, IdMixin, TimestampMixin, SoftDeleteMixin, SlugMixin):
    """Post with all mixins."""
    
    __tablename__ = "posts"
    
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str]
```

## Alembic Migrations

### Создание миграции
```bash
# Создать новую миграцию
alembic revision --autogenerate -m "create users table"

# Применить миграции
alembic upgrade head

# Откатить миграцию
alembic downgrade -1

# История миграций
alembic history

# Текущая версия
alembic current
```

### Миграция вручную
```python
# ✅ ПРАВИЛЬНО - структура миграции
"""create users table

Revision ID: 001
Revises: 
Create Date: 2024-01-01 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Create users table."""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

def downgrade() -> None:
    """Drop users table."""
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
```

## Чеклист моделей

- [ ] SQLAlchemy модели с type hints (Mapped)
- [ ] Pydantic схемы для валидации
- [ ] Разделение Create/Update/Response схем
- [ ] CRUD классы для каждой модели
- [ ] Индексы на часто используемых полях
- [ ] Правильные relationship с cascade
- [ ] Миксины для повторяющегося функционала
- [ ] Alembic миграции для изменений схемы
- [ ] Валидаторы в Pydantic схемах
- [ ] from_attributes=True для ORM моделей
