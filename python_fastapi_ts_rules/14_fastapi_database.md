# FastAPI Database - База данных

## Общие принципы

- **Async SQLAlchemy** для производительности
- **Connection pooling** для эффективности
- **Transactions** для целостности данных
- **Migrations** для версионирования схемы

## Async SQLAlchemy Configuration

### Engine и Session
```python
# ✅ ПРАВИЛЬНО - настройка async SQLAlchemy
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.pool import NullPool, QueuePool

from app.core.config import settings

# Создание async engine
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # SQL логирование
    pool_pre_ping=True,   # Проверка соединений
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=3600,    # Переиспользование соединений
    poolclass=QueuePool if not settings.is_production else NullPool
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Dependency для FastAPI
async def get_db() -> AsyncSession:
    """Database session dependency."""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### Database URL форматы
```python
# ✅ ПРАВИЛЬНО - различные форматы подключения

# PostgreSQL с asyncpg
DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/dbname"

# PostgreSQL с psycopg (sync, для Alembic)
SYNC_DATABASE_URL = "postgresql://user:password@localhost:5432/dbname"

# SQLite (для разработки)
DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# MySQL с aiomysql
DATABASE_URL = "mysql+aiomysql://user:password@localhost:3306/dbname"

# С дополнительными параметрами
DATABASE_URL = (
    "postgresql+asyncpg://user:password@localhost:5432/dbname"
    "?ssl=require&statement_timeout=30000"
)
```

## Connection Pooling

### Настройка пула
```python
# ✅ ПРАВИЛЬНО - оптимизация пула соединений
from sqlalchemy.pool import QueuePool, NullPool

# Для веб-приложений
engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,           # Базовый размер пула
    max_overflow=20,        # Дополнительные соединения
    pool_timeout=30,        # Таймаут ожидания соединения
    pool_recycle=3600,      # Переиспользование через час
    pool_pre_ping=True,     # Проверка жизни соединения
)

# Для serverless (например, AWS Lambda)
engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Без пула, создание нового соединения каждый раз
)

# Для background tasks
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=0,  # Без дополнительных соединений
)
```

## Transactions

### Основы транзакций
```python
# ✅ ПРАВИЛЬНО - работа с транзакциями
from sqlalchemy.ext.asyncio import AsyncSession

async def create_user_with_profile(
    db: AsyncSession,
    user_data: UserCreate,
    profile_data: ProfileCreate
) -> User:
    """Create user with profile in single transaction."""
    try:
        # Создание пользователя
        user = User(**user_data.model_dump())
        db.add(user)
        await db.flush()  # Получить ID без коммита
        
        # Создание профиля
        profile = Profile(
            user_id=user.id,
            **profile_data.model_dump()
        )
        db.add(profile)
        
        # Коммит транзакции
        await db.commit()
        await db.refresh(user)
        
        return user
    
    except Exception as e:
        # Откат при ошибке
        await db.rollback()
        raise

# ✅ ПРАВИЛЬНО - вложенные транзакции (savepoints)
async def transfer_money(
    db: AsyncSession,
    from_account_id: int,
    to_account_id: int,
    amount: float
) -> None:
    """Transfer money between accounts."""
    async with db.begin_nested():  # Savepoint
        # Списание
        from_account = await get_account(db, from_account_id)
        from_account.balance -= amount
        
        # Начисление
        to_account = await get_account(db, to_account_id)
        to_account.balance += amount
        
        # Проверка баланса
        if from_account.balance < 0:
            raise ValueError("Insufficient funds")
    
    await db.commit()
```

### Транзакционный context manager
```python
# ✅ ПРАВИЛЬНО - переиспользуемый транзакционный менеджер
from contextlib import asynccontextmanager

@asynccontextmanager
async def transaction(db: AsyncSession):
    """Transaction context manager."""
    try:
        yield db
        await db.commit()
    except Exception:
        await db.rollback()
        raise

# Использование
async def process_order(db: AsyncSession, order_data: OrderCreate):
    """Process order in transaction."""
    async with transaction(db):
        order = await create_order(db, order_data)
        await update_inventory(db, order.items)
        await send_notification(order.user_id)
        return order
```

## Query Optimization

### Eager Loading
```python
# ✅ ПРАВИЛЬНО - загрузка связанных данных
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload, subqueryload

# selectinload - отдельный запрос для связей
async def get_user_with_posts(db: AsyncSession, user_id: int):
    """Get user with posts (separate query)."""
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.posts))
    )
    return result.scalar_one_or_none()

# joinedload - LEFT JOIN для связей
async def get_user_with_profile(db: AsyncSession, user_id: int):
    """Get user with profile (joined)."""
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(joinedload(User.profile))
    )
    return result.unique().scalar_one_or_none()

# Вложенные загрузки
async def get_user_with_all_relations(db: AsyncSession, user_id: int):
    """Get user with all relations."""
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.posts).selectinload(Post.comments),
            joinedload(User.profile),
            selectinload(User.roles)
        )
    )
    return result.unique().scalar_one_or_none()

# ❌ НЕПРАВИЛЬНО - N+1 проблема
async def get_users_with_posts_bad(db: AsyncSession):
    """Bad: N+1 queries."""
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    for user in users:
        # Каждая итерация = новый запрос!
        posts = await db.execute(
            select(Post).where(Post.author_id == user.id)
        )
        user.posts = posts.scalars().all()
    
    return users
```

### Индексирование
```python
# ✅ ПРАВИЛЬНО - использование индексов
from sqlalchemy import Index

class User(Base):
    """User with indexes."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    
    # Композитный индекс
    __table_args__ = (
        Index("idx_email_username", "email", "username"),
        Index("idx_created_status", "created_at", "status"),
    )

# Использование индексов в запросах
async def search_users(db: AsyncSession, query: str):
    """Search users using indexed fields."""
    result = await db.execute(
        select(User)
        .where(User.email.ilike(f"%{query}%"))  # Использует индекс на email
        .order_by(User.created_at.desc())       # Использует индекс на created_at
    )
    return result.scalars().all()
```

### Pagination эффективно
```python
# ✅ ПРАВИЛЬНО - курсорная пагинация для больших данных
from sqlalchemy import select, func

async def get_posts_cursor_pagination(
    db: AsyncSession,
    cursor: int | None = None,
    limit: int = 20
) -> tuple[list[Post], int | None]:
    """Get posts with cursor-based pagination."""
    query = select(Post).order_by(Post.id.desc()).limit(limit)
    
    if cursor:
        query = query.where(Post.id < cursor)
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    # Следующий курсор
    next_cursor = posts[-1].id if len(posts) == limit else None
    
    return posts, next_cursor

# ✅ ПРАВИЛЬНО - offset пагинация для малых данных
async def get_posts_offset_pagination(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[Post], int]:
    """Get posts with offset pagination."""
    skip = (page - 1) * page_size
    
    # Получение данных
    posts_result = await db.execute(
        select(Post)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(page_size)
    )
    posts = posts_result.scalars().all()
    
    # Общее количество (кэшируйте это!)
    count_result = await db.execute(select(func.count()).select_from(Post))
    total = count_result.scalar()
    
    return posts, total
```

## Bulk Operations

### Bulk insert
```python
# ✅ ПРАВИЛЬНО - массовая вставка
from sqlalchemy import insert

async def bulk_create_users(
    db: AsyncSession,
    users_data: list[dict]
) -> None:
    """Bulk insert users."""
    await db.execute(
        insert(User),
        users_data
    )
    await db.commit()

# Альтернативный способ
async def bulk_create_users_alt(
    db: AsyncSession,
    users_data: list[UserCreate]
) -> list[User]:
    """Bulk create with ORM."""
    users = [User(**user.model_dump()) for user in users_data]
    db.add_all(users)
    await db.commit()
    
    for user in users:
        await db.refresh(user)
    
    return users
```

### Bulk update
```python
# ✅ ПРАВИЛЬНО - массовое обновление
from sqlalchemy import update

async def bulk_activate_users(
    db: AsyncSession,
    user_ids: list[int]
) -> None:
    """Bulk activate users."""
    await db.execute(
        update(User)
        .where(User.id.in_(user_ids))
        .values(is_active=True, updated_at=func.now())
    )
    await db.commit()

# С условиями
async def bulk_update_old_posts(
    db: AsyncSession,
    days_old: int = 30
) -> None:
    """Archive old posts."""
    cutoff_date = datetime.now() - timedelta(days=days_old)
    
    await db.execute(
        update(Post)
        .where(Post.created_at < cutoff_date)
        .values(status="archived")
    )
    await db.commit()
```

## Raw SQL

### Выполнение raw SQL
```python
# ✅ ПРАВИЛЬНО - raw SQL когда необходимо
from sqlalchemy import text

async def execute_raw_query(db: AsyncSession) -> list:
    """Execute raw SQL query."""
    result = await db.execute(
        text("""
            SELECT u.id, u.username, COUNT(p.id) as post_count
            FROM users u
            LEFT JOIN posts p ON p.author_id = u.id
            WHERE u.is_active = true
            GROUP BY u.id, u.username
            HAVING COUNT(p.id) > :min_posts
            ORDER BY post_count DESC
        """),
        {"min_posts": 5}
    )
    return result.all()

# Возврат ORM объектов
async def get_users_raw(db: AsyncSession) -> list[User]:
    """Get users using raw SQL but return ORM objects."""
    result = await db.execute(
        text("SELECT * FROM users WHERE is_active = true")
    )
    return [User(**dict(row)) for row in result]
```

## Database Initialization

### Создание таблиц
```python
# ✅ ПРАВИЛЬНО - инициализация БД
from sqlalchemy.ext.asyncio import AsyncEngine
from app.db.base import Base

async def create_tables(engine: AsyncEngine) -> None:
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def drop_tables(engine: AsyncEngine) -> None:
    """Drop all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

# Скрипт инициализации
async def init_db() -> None:
    """Initialize database."""
    from app.db.session import engine
    
    # Создать таблицы
    await create_tables(engine)
    
    # Добавить начальные данные
    async with async_session_maker() as session:
        await seed_initial_data(session)

async def seed_initial_data(db: AsyncSession) -> None:
    """Seed initial data."""
    # Создать админа
    admin = User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        is_superuser=True
    )
    db.add(admin)
    await db.commit()
```

## Alembic Migrations

### Конфигурация Alembic
```python
# ✅ ПРАВИЛЬНО - alembic/env.py для async
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context
from app.db.base import Base
from app.core.config import settings

config = context.config

# Override sqlalchemy.url from settings
config.set_main_option("sqlalchemy.url", settings.SYNC_DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    """Run migrations."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """Run migrations asynchronously."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    import asyncio
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Создание миграций
```bash
# Автогенерация миграции
alembic revision --autogenerate -m "add users table"

# Ручная миграция
alembic revision -m "custom migration"

# Применить миграции
alembic upgrade head

# Откатить одну миграцию
alembic downgrade -1

# Откатить к конкретной версии
alembic downgrade abc123

# История миграций
alembic history

# Текущая версия
alembic current
```

### Data migrations
```python
# ✅ ПРАВИЛЬНО - миграция данных
"""add default roles

Revision ID: abc123
"""
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    """Add default roles."""
    # Создание таблицы
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Вставка данных
    roles_table = sa.table(
        'roles',
        sa.column('id', sa.Integer),
        sa.column('name', sa.String)
    )
    
    op.bulk_insert(
        roles_table,
        [
            {'id': 1, 'name': 'admin'},
            {'id': 2, 'name': 'user'},
            {'id': 3, 'name': 'moderator'}
        ]
    )

def downgrade() -> None:
    """Remove roles table."""
    op.drop_table('roles')
```

## Database Testing

### Test fixtures
```python
# ✅ ПРАВИЛЬНО - фикстуры для тестирования БД
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()

@pytest.fixture
async def test_db(test_engine):
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
async def test_user(test_db):
    """Create test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed"
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user
```

## Monitoring и Debugging

### SQL логирование
```python
# ✅ ПРАВИЛЬНО - настройка логирования SQL
import logging

# Логирование всех SQL запросов
logging.basicConfig()
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

# Для отладки (показывает параметры)
logging.getLogger("sqlalchemy.engine").setLevel(logging.DEBUG)

# В production - только ошибки
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)
```

### Query profiling
```python
# ✅ ПРАВИЛЬНО - профилирование запросов
from sqlalchemy import event
import time

@event.listens_for(engine.sync_engine, "before_cursor_execute")
def receive_before_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Log query start."""
    conn.info.setdefault("query_start_time", []).append(time.time())

@event.listens_for(engine.sync_engine, "after_cursor_execute")
def receive_after_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Log query duration."""
    total = time.time() - conn.info["query_start_time"].pop()
    logger.info(f"Query took {total:.3f}s: {statement[:100]}")
```

## Чеклист database

- [ ] Async SQLAlchemy настроен правильно
- [ ] Connection pooling оптимизирован
- [ ] Транзакции для критичных операций
- [ ] Eager loading для избежания N+1
- [ ] Индексы на часто используемых полях
- [ ] Курсорная пагинация для больших данных
- [ ] Bulk operations для массовых изменений
- [ ] Alembic для миграций
- [ ] Test fixtures для тестирования
- [ ] SQL логирование в development
