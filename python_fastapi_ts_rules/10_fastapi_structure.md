# FastAPI Structure - Структура проекта

## Общие принципы

- **Модульная структура** - разделение по функциональности
- **Separation of Concerns** - разделение ответственности
- **Масштабируемость** - легкость добавления нового функционала
- **DRY** - избегайте дублирования кода

## Базовая структура проекта

### Минимальная структура
```
myapp/
├── app/
│   ├── __init__.py
│   ├── main.py              # Точка входа FastAPI
│   ├── config.py            # Конфигурация
│   ├── dependencies.py      # Общие зависимости
│   └── routes/
│       ├── __init__.py
│       └── users.py
├── tests/
│   ├── __init__.py
│   └── test_users.py
├── .env                      # Переменные окружения
├── .env.example             # Пример .env
├── requirements.txt         # Зависимости
├── pyproject.toml           # Poetry/настройки проекта
└── README.md
```

### Полная структура
```
myapp/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI приложение
│   │
│   ├── api/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── deps.py          # API зависимости
│   │   └── v1/              # Версионирование API
│   │       ├── __init__.py
│   │       ├── router.py    # Главный роутер v1
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── users.py
│   │           ├── auth.py
│   │           └── posts.py
│   │
│   ├── core/                # Ядро приложения
│   │   ├── __init__.py
│   │   ├── config.py        # Настройки
│   │   ├── security.py      # Безопасность (JWT, hash)
│   │   └── logging.py       # Логирование
│   │
│   ├── db/                  # База данных
│   │   ├── __init__.py
│   │   ├── base.py          # Base class для моделей
│   │   ├── session.py       # Сессии БД
│   │   └── init_db.py       # Инициализация БД
│   │
│   ├── models/              # SQLAlchemy модели
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── post.py
│   │
│   ├── schemas/             # Pydantic схемы
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── post.py
│   │
│   ├── crud/                # CRUD операции
│   │   ├── __init__.py
│   │   ├── base.py          # Базовый CRUD
│   │   ├── user.py
│   │   └── post.py
│   │
│   ├── services/            # Бизнес-логика
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── email_service.py
│   │
│   ├── utils/               # Утилиты
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   └── formatters.py
│   │
│   └── middleware/          # Middleware
│       ├── __init__.py
│       ├── timing.py
│       └── error_handler.py
│
├── alembic/                 # Миграции БД
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
│
├── tests/                   # Тесты
│   ├── __init__.py
│   ├── conftest.py
│   ├── api/
│   │   └── v1/
│   │       ├── test_users.py
│   │       └── test_auth.py
│   └── services/
│       └── test_user_service.py
│
├── scripts/                 # Вспомогательные скрипты
│   ├── init_db.py
│   └── seed_data.py
│
├── .env
├── .env.example
├── .gitignore
├── alembic.ini
├── pyproject.toml
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Файлы приложения

### main.py
```python
# ✅ ПРАВИЛЬНО - main.py с lifespan (рекомендуется)
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import engine

# Настройка логирования
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler.
    
    Startup: code before `yield`
    Shutdown: code after `yield`
    """
    # Startup
    # await init_database()
    # await init_cache()
    yield
    # Shutdown
    await engine.dispose()


# Создание приложения
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,  # Используем lifespan вместо on_event
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
```

### core/config.py
```python
# ✅ ПРАВИЛЬНО - конфигурация с Pydantic Settings
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Основные настройки
    PROJECT_NAME: str = "My FastAPI App"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    
    # База данных
    DATABASE_URL: str
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    
    # Безопасность
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # Redis
    REDIS_URL: str | None = None
    
    # Email
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    
    # Логирование
    LOG_LEVEL: str = "INFO"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.ENVIRONMENT == "production"

# Singleton instance
settings = Settings()
```

### core/security.py
```python
# ✅ ПРАВИЛЬНО - модуль безопасности
from datetime import datetime, timedelta
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)

def create_access_token(
    subject: str | Any,
    expires_delta: timedelta | None = None
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode JWT token."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )
```

## Database Structure

### db/session.py
```python
# ✅ ПРАВИЛЬНО - конфигурация сессий
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=not settings.is_production,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    poolclass=NullPool if settings.is_production else None
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Dependency
async def get_db() -> AsyncSession:
    """Get database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
```

### db/base.py
```python
# ✅ ПРАВИЛЬНО - базовые классы моделей
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """Base class for all models."""
    pass

class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""
    
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
```

## API Structure

### api/v1/router.py
```python
# ✅ ПРАВИЛЬНО - главный роутер API v1
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, posts

api_router = APIRouter()

# Подключение endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

api_router.include_router(
    posts.router,
    prefix="/posts",
    tags=["posts"]
)
```

### api/deps.py
```python
# ✅ ПРАВИЛЬНО - общие зависимости API
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.crud.user import user_crud

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login"
)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_crud.get(db, id=int(user_id))
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
```

## CRUD Pattern

### crud/base.py
```python
# ✅ ПРАВИЛЬНО - базовый CRUD класс
from typing import Any, Generic, Type, TypeVar
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base CRUD class."""
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    async def get(
        self,
        db: AsyncSession,
        id: Any
    ) -> ModelType | None:
        """Get single record by ID."""
        result = await db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> list[ModelType]:
        """Get multiple records."""
        result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType
    ) -> ModelType:
        """Create new record."""
        obj_data = obj_in.model_dump()
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | dict[str, Any]
    ) -> ModelType:
        """Update record."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def remove(
        self,
        db: AsyncSession,
        *,
        id: int
    ) -> ModelType:
        """Delete record."""
        obj = await self.get(db, id=id)
        await db.delete(obj)
        await db.commit()
        return obj
```

## Services Layer

### services/user_service.py
```python
# ✅ ПРАВИЛЬНО - сервисный слой для бизнес-логики
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import user_crud
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.services.email_service import send_welcome_email

class UserService:
    """User business logic."""
    
    async def create_user(
        self,
        db: AsyncSession,
        user_in: UserCreate
    ) -> User:
        """Create new user with hashed password."""
        # Hash password
        user_data = user_in.model_dump()
        user_data["hashed_password"] = get_password_hash(
            user_data.pop("password")
        )
        
        # Create user
        user = await user_crud.create(db, obj_in=user_data)
        
        # Send welcome email
        await send_welcome_email(user.email, user.username)
        
        return user
    
    async def authenticate(
        self,
        db: AsyncSession,
        email: str,
        password: str
    ) -> User | None:
        """Authenticate user."""
        user = await user_crud.get_by_email(db, email=email)
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    async def update_profile(
        self,
        db: AsyncSession,
        user: User,
        user_in: UserUpdate
    ) -> User:
        """Update user profile."""
        return await user_crud.update(
            db,
            db_obj=user,
            obj_in=user_in
        )

user_service = UserService()
```

## Testing Structure

### tests/conftest.py
```python
# ✅ ПРАВИЛЬНО - общие фикстуры для тестов
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Test database
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost/test_db"

@pytest.fixture(scope="session")
def anyio_backend():
    """Use asyncio backend for tests."""
    return "asyncio"

@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine):
    """Get test database session."""
    async_session = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session):
    """Get test HTTP client."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()
```

## Docker Configuration

### Dockerfile
```dockerfile
# ✅ ПРАВИЛЬНО - multi-stage Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy application
COPY ./app ./app

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
# ✅ ПРАВИЛЬНО - docker-compose для разработки
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./app:/app/app
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Чеклист структуры

- [ ] Модульная организация по функциональности
- [ ] Разделение на слои (API, CRUD, Services)
- [ ] Централизованная конфигурация (settings)
- [ ] Версионирование API (/api/v1)
- [ ] Отдельные схемы Pydantic для Create/Update/Response
- [ ] Базовые CRUD классы для переиспользования
- [ ] Dependency injection для БД и аутентификации
- [ ] Middleware для логирования и ошибок
- [ ] Тесты с фикстурами
- [ ] Docker и docker-compose настроены
