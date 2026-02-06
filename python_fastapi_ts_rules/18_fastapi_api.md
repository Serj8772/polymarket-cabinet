# FastAPI API - API разработка

## Общие принципы

- **RESTful design** - следуйте REST соглашениям
- **API versioning** - версионируйте API
- **Documentation** - автоматическая документация
- **Consistency** - единообразие во всем API

## API Design

### RESTful Resources
```python
# ✅ ПРАВИЛЬНО - RESTful ресурсы
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")

# Collection endpoints
@router.get("/users")
async def list_users(): pass

@router.post("/users")
async def create_user(): pass

# Resource endpoints
@router.get("/users/{user_id}")
async def get_user(user_id: int): pass

@router.put("/users/{user_id}")
async def update_user(user_id: int): pass

@router.patch("/users/{user_id}")
async def partial_update_user(user_id: int): pass

@router.delete("/users/{user_id}")
async def delete_user(user_id: int): pass

# Nested resources
@router.get("/users/{user_id}/posts")
async def list_user_posts(user_id: int): pass

@router.post("/users/{user_id}/posts")
async def create_user_post(user_id: int): pass

# Actions (не CRUD)
@router.post("/users/{user_id}/activate")
async def activate_user(user_id: int): pass

@router.post("/users/{user_id}/deactivate")
async def deactivate_user(user_id: int): pass
```

### HTTP Status Codes
```python
# ✅ ПРАВИЛЬНО - правильные status codes
from fastapi import status

# 2xx - Success
@router.get("/items", status_code=status.HTTP_200_OK)
async def list_items(): pass

@router.post("/items", status_code=status.HTTP_201_CREATED)
async def create_item(): pass

@router.put("/items/{id}", status_code=status.HTTP_200_OK)
async def update_item(id: int): pass

@router.delete("/items/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(id: int): pass

# 4xx - Client Errors
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid input data"
)

raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated"
)

raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Not enough permissions"
)

raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found"
)

raise HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Resource already exists"
)

raise HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Validation error"
)

# 5xx - Server Errors
raise HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Internal server error"
)
```

## API Versioning

### URL versioning
```python
# ✅ ПРАВИЛЬНО - версионирование через URL
from fastapi import FastAPI, APIRouter

app = FastAPI()

# API v1
v1_router = APIRouter(prefix="/api/v1", tags=["v1"])

@v1_router.get("/users")
async def list_users_v1():
    """List users (v1)."""
    return {"version": 1, "users": []}

# API v2
v2_router = APIRouter(prefix="/api/v2", tags=["v2"])

@v2_router.get("/users")
async def list_users_v2():
    """List users (v2) with additional fields."""
    return {"version": 2, "users": [], "total": 0, "page": 1}

app.include_router(v1_router)
app.include_router(v2_router)
```

### Header versioning
```python
# ✅ ПРАВИЛЬНО - версионирование через header
from fastapi import Header, HTTPException

async def get_api_version(
    api_version: str = Header(None, alias="X-API-Version")
) -> str:
    """Get API version from header."""
    if api_version not in ["1.0", "2.0"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid API version"
        )
    return api_version

@router.get("/users")
async def list_users(version: str = Depends(get_api_version)):
    """List users with version-specific logic."""
    if version == "1.0":
        return get_users_v1()
    else:
        return get_users_v2()
```

## Request/Response Models

### Request models
```python
# ✅ ПРАВИЛЬНО - четкие request модели
from pydantic import BaseModel, Field, EmailStr

class UserCreate(BaseModel):
    """User creation request."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str | None = None

class UserUpdate(BaseModel):
    """User update request (partial)."""
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    full_name: str | None = None

class PostCreate(BaseModel):
    """Post creation request."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str
    tags: list[str] = Field(default_factory=list)
    published: bool = False
```

### Response models
```python
# ✅ ПРАВИЛЬНО - отдельные response модели
from datetime import datetime

class UserResponse(BaseModel):
    """User response (without password)."""
    id: int
    username: str
    email: str
    full_name: str | None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PostResponse(BaseModel):
    """Post response."""
    id: int
    title: str
    content: str
    author_id: int
    tags: list[str]
    published: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PostWithAuthor(PostResponse):
    """Post response with author details."""
    author: UserResponse

# Использование
@router.get("/posts/{post_id}", response_model=PostWithAuthor)
async def get_post(post_id: int):
    """Get post with author."""
    pass
```

### Error responses
```python
# ✅ ПРАВИЛЬНО - структурированные ошибки
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    message: str
    details: dict | None = None

class ValidationErrorResponse(BaseModel):
    """Validation error response."""
    error: str = "validation_error"
    message: str
    fields: dict[str, list[str]]

# Использование
@router.post("/users", responses={
    201: {"model": UserResponse},
    400: {"model": ErrorResponse},
    422: {"model": ValidationErrorResponse}
})
async def create_user(user_in: UserCreate):
    """Create user with documented error responses."""
    pass
```

## Pagination

### Offset-based pagination
```python
# ✅ ПРАВИЛЬНО - offset пагинация
from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int

class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=100)

@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List users with pagination."""
    skip = (pagination.page - 1) * pagination.page_size
    
    # Get items
    users = await user_crud.get_multi(
        db,
        skip=skip,
        limit=pagination.page_size
    )
    
    # Get total count
    total = await user_crud.count(db)
    
    return PaginatedResponse(
        items=users,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=(total + pagination.page_size - 1) // pagination.page_size
    )
```

### Cursor-based pagination
```python
# ✅ ПРАВИЛЬНО - cursor пагинация для больших данных
class CursorPaginatedResponse(BaseModel, Generic[T]):
    """Cursor paginated response."""
    items: list[T]
    next_cursor: int | None
    has_more: bool

@router.get("/posts", response_model=CursorPaginatedResponse[PostResponse])
async def list_posts(
    cursor: int | None = None,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List posts with cursor pagination."""
    query = select(Post).order_by(Post.id.desc()).limit(limit + 1)
    
    if cursor:
        query = query.where(Post.id < cursor)
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    has_more = len(posts) > limit
    if has_more:
        posts = posts[:-1]
    
    next_cursor = posts[-1].id if has_more and posts else None
    
    return CursorPaginatedResponse(
        items=posts,
        next_cursor=next_cursor,
        has_more=has_more
    )
```

## Filtering and Sorting

### Query parameters
```python
# ✅ ПРАВИЛЬНО - фильтрация и сортировка
from enum import Enum

class SortOrder(str, Enum):
    """Sort order."""
    ASC = "asc"
    DESC = "desc"

class UserFilters(BaseModel):
    """User filter parameters."""
    search: str | None = None
    is_active: bool | None = None
    role: str | None = None
    sort_by: str = "created_at"
    sort_order: SortOrder = SortOrder.DESC

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    filters: UserFilters = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List users with filters and sorting."""
    query = select(User)
    
    # Фильтры
    if filters.search:
        query = query.where(
            or_(
                User.username.ilike(f"%{filters.search}%"),
                User.email.ilike(f"%{filters.search}%")
            )
        )
    
    if filters.is_active is not None:
        query = query.where(User.is_active == filters.is_active)
    
    if filters.role:
        query = query.where(User.role == filters.role)
    
    # Сортировка
    sort_column = getattr(User, filters.sort_by, User.created_at)
    if filters.sort_order == SortOrder.DESC:
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    result = await db.execute(query)
    return result.scalars().all()
```

## HATEOAS

### Hypermedia links
```python
# ✅ ПРАВИЛЬНО - HATEOAS links
from pydantic import BaseModel

class Link(BaseModel):
    """HATEOAS link."""
    rel: str
    href: str
    method: str = "GET"

class UserWithLinks(UserResponse):
    """User response with HATEOAS links."""
    links: list[Link]

def add_user_links(user: User) -> dict:
    """Add HATEOAS links to user."""
    return {
        **user.__dict__,
        "links": [
            Link(rel="self", href=f"/api/v1/users/{user.id}"),
            Link(rel="posts", href=f"/api/v1/users/{user.id}/posts"),
            Link(rel="update", href=f"/api/v1/users/{user.id}", method="PUT"),
            Link(rel="delete", href=f"/api/v1/users/{user.id}", method="DELETE"),
        ]
    }

@router.get("/users/{user_id}", response_model=UserWithLinks)
async def get_user(user_id: int):
    """Get user with HATEOAS links."""
    user = await user_crud.get(db, id=user_id)
    return add_user_links(user)
```

## API Documentation

### OpenAPI customization
```python
# ✅ ПРАВИЛЬНО - кастомизация OpenAPI
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    """Custom OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="My API",
        version="1.0.0",
        description="API for managing users and posts",
        routes=app.routes,
    )
    
    # Добавление security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    # Добавление тегов
    openapi_schema["tags"] = [
        {
            "name": "users",
            "description": "Operations with users"
        },
        {
            "name": "posts",
            "description": "Operations with posts"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

### Endpoint documentation
```python
# ✅ ПРАВИЛЬНО - детальная документация endpoints
@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new user",
    description="Create a new user with the provided information",
    response_description="Successfully created user",
    tags=["users"],
    responses={
        201: {
            "description": "User created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "username": "john",
                        "email": "john@example.com"
                    }
                }
            }
        },
        400: {"description": "Invalid input data"},
        409: {"description": "User already exists"}
    }
)
async def create_user(
    user_in: UserCreate = Body(
        ...,
        example={
            "username": "john",
            "email": "john@example.com",
            "password": "SecurePass123!"
        }
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user with all the information:
    
    - **username**: Unique username (3-50 chars)
    - **email**: Valid email address
    - **password**: Strong password (min 8 chars)
    - **full_name**: Optional full name
    """
    # Check if user exists
    existing = await user_crud.get_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )
    
    # Create user
    user = await user_crud.create(db, obj_in=user_in)
    return user
```

## Rate Limiting

### API rate limits
```python
# ✅ ПРАВИЛЬНО - rate limiting по endpoint
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/public/data")
@limiter.limit("100/hour")
async def public_endpoint(request: Request):
    """Public endpoint with rate limit."""
    return {"data": "public"}

@router.get("/users/me")
@limiter.limit("1000/hour")
async def authenticated_endpoint(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Authenticated endpoint with higher rate limit."""
    return current_user
```

## API Metrics

### Prometheus metrics
```python
# ✅ ПРАВИЛЬНО - метрики API
from prometheus_client import Counter, Histogram, generate_latest
import time

# Метрики
REQUEST_COUNT = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Add metrics to requests."""
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    # Записать метрики
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics."""
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

## API Testing

### Integration tests
```python
# ✅ ПРАВИЛЬНО - интеграционные тесты API
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_and_get_user(client: AsyncClient):
    """Test user creation and retrieval."""
    # Create user
    response = await client.post(
        "/api/v1/users",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    user_id = data["id"]
    
    # Get user
    response = await client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

@pytest.mark.asyncio
async def test_pagination(client: AsyncClient):
    """Test pagination."""
    # Create multiple users
    for i in range(25):
        await client.post(
            "/api/v1/users",
            json={
                "username": f"user{i}",
                "email": f"user{i}@example.com",
                "password": "password123"
            }
        )
    
    # Test first page
    response = await client.get("/api/v1/users?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] == 25
    assert data["pages"] == 3
```

## API Client Generation

### OpenAPI client
```python
# ✅ ПРАВИЛЬНО - генерация клиента из OpenAPI
"""
# Экспорт OpenAPI schema
curl http://localhost:8000/openapi.json > openapi.json

# Генерация Python клиента
openapi-python-client generate --path openapi.json

# Генерация TypeScript клиента
openapi-generator generate \
  -i openapi.json \
  -g typescript-axios \
  -o ./client
"""

# Использование сгенерированного клиента
from my_api_client import Client
from my_api_client.models import UserCreate

client = Client(base_url="http://localhost:8000")

# Создание пользователя
user = client.users.create(
    UserCreate(
        username="john",
        email="john@example.com",
        password="password123"
    )
)

# Получение пользователя
user = client.users.get(user_id=1)
```

## API Best Practices

### Idempotency
```python
# ✅ ПРАВИЛЬНО - идемпотентность для PUT/DELETE
@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Idempotent update operation."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404)
    
    # Повторный запрос с теми же данными вернет тот же результат
    user = await user_crud.update(db, db_obj=user, obj_in=user_in)
    return user

# POST с idempotency key
@router.post("/payments")
async def create_payment(
    payment: PaymentCreate,
    idempotency_key: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Create payment with idempotency key."""
    # Проверить существующий платеж с таким же ключом
    existing = await payment_crud.get_by_idempotency_key(
        db,
        key=idempotency_key
    )
    if existing:
        return existing
    
    # Создать новый платеж
    payment = await payment_crud.create(
        db,
        obj_in=payment,
        idempotency_key=idempotency_key
    )
    return payment
```

## Чеклист API

- [ ] RESTful design (правильные методы и URLs)
- [ ] API versioning (/api/v1)
- [ ] Правильные HTTP status codes
- [ ] Request/Response модели с валидацией
- [ ] Pagination для списков
- [ ] Filtering и sorting
- [ ] Error responses структурированы
- [ ] OpenAPI документация полная
- [ ] Rate limiting настроен
- [ ] CORS настроен правильно
- [ ] Authentication/Authorization
- [ ] Metrics и monitoring
- [ ] Integration tests
- [ ] Idempotency для критичных операций
- [ ] HATEOAS links (опционально)
