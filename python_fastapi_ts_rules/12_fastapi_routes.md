# FastAPI Routes - Роуты

## Общие принципы

- **RESTful conventions** для именования endpoints
- **Правильные HTTP методы** для операций
- **Status codes** соответствуют действиям
- **Dependency Injection** для переиспользования логики

## Основы роутов

### APIRouter
```python
# ✅ ПРАВИЛЬНО - использование APIRouter с Annotated (FastAPI 0.95+)
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.crud.user import user_crud
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.models.user import User

router = APIRouter()

# Type aliases для чистоты кода (рекомендуется)
DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: DB,
    skip: int = 0,
    limit: int = 100,
):
    """List all users."""
    users = await user_crud.get_multi(db, skip=skip, limit=limit)
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: DB,
):
    """Get user by ID."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: DB,
):
    """Create new user."""
    # Check if user exists
    existing = await user_crud.get_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user = await user_crud.create(db, obj_in=user_in)
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: DB,
    current_user: CurrentUser,
):
    """Update user."""
    # Check permissions
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user = await user_crud.update(db, db_obj=user, obj_in=user_in)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: DB,
    current_user: Annotated[User, Depends(get_current_superuser)],
):
    """Delete user (superuser only)."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await user_crud.remove(db, id=user_id)
```

## HTTP Methods

### RESTful соглашения
```python
# ✅ ПРАВИЛЬНО - правильные HTTP методы

# GET - получение данных (идемпотентный, кэшируемый)
@router.get("/items")
async def list_items(): pass

@router.get("/items/{item_id}")
async def get_item(item_id: int): pass

# POST - создание ресурса (не идемпотентный)
@router.post("/items", status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate): pass

# PUT - полное обновление (идемпотентный)
@router.put("/items/{item_id}")
async def replace_item(item_id: int, item: ItemUpdate): pass

# PATCH - частичное обновление (не идемпотентный)
@router.patch("/items/{item_id}")
async def update_item(item_id: int, item: ItemPartialUpdate): pass

# DELETE - удаление ресурса (идемпотентный)
@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int): pass

# ❌ НЕПРАВИЛЬНО - неправильные методы
@router.get("/items/create")  # Должен быть POST
@router.post("/items/delete")  # Должен быть DELETE
@router.get("/items/update")  # Должен быть PUT или PATCH
```

## Path Parameters

### Типизированные параметры
```python
# ✅ ПРАВИЛЬНО - path параметры с валидацией
from fastapi import Path

@router.get("/users/{user_id}")
async def get_user(
    user_id: int = Path(..., gt=0, description="User ID")
):
    """Get user by ID."""
    pass

@router.get("/posts/{post_slug}")
async def get_post(
    post_slug: str = Path(
        ...,
        min_length=3,
        max_length=100,
        pattern="^[a-z0-9-]+$",
        description="Post URL slug"
    )
):
    """Get post by slug."""
    pass

# ✅ ПРАВИЛЬНО - Enum для ограниченных значений
from enum import Enum

class ModelName(str, Enum):
    ALEXNET = "alexnet"
    RESNET = "resnet"
    LENET = "lenet"

@router.get("/models/{model_name}")
async def get_model(model_name: ModelName):
    """Get model by name."""
    if model_name == ModelName.ALEXNET:
        return {"model": "AlexNet"}
    # ...
```

## Query Parameters

### Параметры запроса
```python
# ✅ ПРАВИЛЬНО - query параметры с валидацией
from fastapi import Query

@router.get("/items")
async def list_items(
    skip: int = Query(0, ge=0, description="Skip N items"),
    limit: int = Query(10, ge=1, le=100, description="Limit results"),
    search: str | None = Query(None, min_length=3, max_length=50),
    sort_by: str = Query("created_at", regex="^(name|created_at|updated_at)$"),
    order: str = Query("desc", regex="^(asc|desc)$")
):
    """List items with filtering and pagination."""
    pass

# ✅ ПРАВИЛЬНО - список значений
@router.get("/items")
async def filter_items(
    tags: list[str] = Query([], description="Filter by tags")
):
    """Filter items by tags."""
    # /items?tags=python&tags=fastapi
    pass

# ✅ ПРАВИЛЬНО - alias для query параметров
@router.get("/items")
async def search_items(
    q: str | None = Query(None, alias="item-query")
):
    """Search items."""
    # /items?item-query=test
    pass
```

## Request Body

### Pydantic модели
```python
# ✅ ПРАВИЛЬНО - тело запроса с Pydantic
from pydantic import BaseModel, Field

class ItemCreate(BaseModel):
    """Item creation schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    price: float = Field(..., gt=0)
    tax: float | None = Field(None, ge=0, le=100)
    tags: list[str] = Field(default_factory=list)

@router.post("/items")
async def create_item(item: ItemCreate):
    """Create item."""
    return item

# ✅ ПРАВИЛЬНО - множественные body параметры
class Item(BaseModel):
    name: str
    price: float

class User(BaseModel):
    username: str

@router.post("/items")
async def create_item(
    item: Item,
    user: User,
    importance: int = Body(...)
):
    """Create item with user and importance."""
    return {"item": item, "user": user, "importance": importance}

# ✅ ПРАВИЛЬНО - embedded body
@router.post("/items")
async def create_item(
    item: Item = Body(..., embed=True)
):
    """Create item (embedded in JSON)."""
    # Request: {"item": {"name": "Foo", "price": 42}}
    return item
```

## Response Models

### Response model и status code
```python
# ✅ ПРАВИЛЬНО - явный response_model
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get user (excludes password)."""
    user = await user_crud.get(db, id=user_id)
    return user  # Автоматически конвертируется в UserResponse

# ✅ ПРАВИЛЬНО - разные response models
from fastapi.responses import JSONResponse

@router.post("/users", response_model=UserResponse)
async def create_user(user_in: UserCreate):
    """Create user."""
    pass

@router.get("/users", response_model=list[UserResponse])
async def list_users():
    """List users."""
    pass

# ✅ ПРАВИЛЬНО - response_model с Union
@router.get("/items/{item_id}", response_model=Item | ErrorResponse)
async def get_item(item_id: int):
    """Get item or error."""
    pass

# ✅ ПРАВИЛЬНО - исключение полей
@router.get(
    "/users/me",
    response_model=UserResponse,
    response_model_exclude_unset=True
)
async def get_current_user_me(
    current_user: User = Depends(get_current_user)
):
    """Get current user (exclude unset fields)."""
    return current_user
```

### Status codes
```python
# ✅ ПРАВИЛЬНО - правильные status codes
from fastapi import status

# 200 OK - успешный GET, PUT, PATCH
@router.get("/items/{item_id}")
async def get_item(item_id: int):
    pass

# 201 Created - успешный POST
@router.post("/items", status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate):
    pass

# 204 No Content - успешный DELETE (без тела ответа)
@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int):
    pass

# 400 Bad Request - невалидные данные
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid data"
)

# 401 Unauthorized - не аутентифицирован
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"}
)

# 403 Forbidden - нет прав
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Not enough permissions"
)

# 404 Not Found - ресурс не найден
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Item not found"
)

# 409 Conflict - конфликт (например, дубликат)
raise HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="User already exists"
)

# 422 Unprocessable Entity - ошибка валидации Pydantic
# Автоматически возвращается FastAPI
```

## Dependencies

### Переиспользуемые зависимости
```python
# ✅ ПРАВИЛЬНО - зависимости для общей логики
from fastapi import Depends, Header, HTTPException

# Простая зависимость
async def get_token_header(x_token: str = Header(...)):
    """Validate token in header."""
    if x_token != "secret-token":
        raise HTTPException(status_code=400, detail="Invalid token")

# Класс как зависимость
class CommonQueryParams:
    """Common query parameters."""
    
    def __init__(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None
    ):
        self.skip = skip
        self.limit = limit
        self.search = search

# Использование
@router.get("/items")
async def list_items(
    commons: CommonQueryParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List items with common params."""
    pass

# Зависимость с подзависимостями
async def verify_token(token: str = Depends(oauth2_scheme)):
    """Verify JWT token."""
    return decode_token(token)

async def get_current_user(
    token_data: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from token."""
    user = await user_crud.get(db, id=token_data["sub"])
    if not user:
        raise HTTPException(status_code=404)
    return user
```

### Router dependencies
```python
# ✅ ПРАВИЛЬНО - зависимости на уровне роутера
from fastapi import APIRouter, Depends

# Все эндпоинты этого роутера будут проверять токен
router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_token_header)]
)

@router.get("/")
async def list_users():
    """List users (с проверкой токена)."""
    pass

# Глобальные зависимости для приложения
app = FastAPI(
    dependencies=[Depends(global_dependency)]
)
```

## File Uploads

### Загрузка файлов
```python
# ✅ ПРАВИЛЬНО - загрузка одного файла
from fastapi import File, UploadFile

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload single file."""
    contents = await file.read()
    
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents)
    }

# ✅ ПРАВИЛЬНО - загрузка нескольких файлов
@router.post("/upload-multiple")
async def upload_multiple_files(files: list[UploadFile] = File(...)):
    """Upload multiple files."""
    return [
        {"filename": file.filename, "content_type": file.content_type}
        for file in files
    ]

# ✅ ПРАВИЛЬНО - файл с дополнительными данными
@router.post("/upload-with-data")
async def upload_with_data(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None)
):
    """Upload file with metadata."""
    return {
        "filename": file.filename,
        "title": title,
        "description": description
    }

# ✅ ПРАВИЛЬНО - сохранение файла
import aiofiles
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def save_file(file: UploadFile = File(...)):
    """Save uploaded file."""
    file_path = UPLOAD_DIR / file.filename
    
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    return {"filename": file.filename, "path": str(file_path)}
```

## Background Tasks

### Фоновые задачи
```python
# ✅ ПРАВИЛЬНО - фоновые задачи
from fastapi import BackgroundTasks

def send_email(email: str, message: str):
    """Send email (blocking operation in background)."""
    # Отправка email
    pass

@router.post("/send-notification")
async def send_notification(
    email: str,
    background_tasks: BackgroundTasks
):
    """Send notification in background."""
    background_tasks.add_task(send_email, email, "Notification message")
    return {"message": "Notification sent"}

# ✅ ПРАВИЛЬНО - несколько фоновых задач
@router.post("/register")
async def register_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Register user with background tasks."""
    # Создание пользователя
    user = await user_crud.create(db, obj_in=user_in)
    
    # Фоновые задачи
    background_tasks.add_task(send_welcome_email, user.email)
    background_tasks.add_task(log_registration, user.id)
    background_tasks.add_task(sync_with_crm, user)
    
    return user
```

## WebSocket Routes

### WebSocket endpoint
```python
# ✅ ПРАВИЛЬНО - WebSocket endpoint
from fastapi import WebSocket, WebSocketDisconnect

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: int
):
    """WebSocket connection."""
    await websocket.accept()
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            
            # Process and send response
            response = f"Client {client_id}: {data}"
            await websocket.send_text(response)
    
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")

# ✅ ПРАВИЛЬНО - WebSocket manager для broadcast
class ConnectionManager:
    """Manage WebSocket connections."""
    
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Connect new client."""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect client."""
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast message to all clients."""
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    """WebSocket with broadcast."""
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client {client_id}: {data}")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client {client_id} left")
```

## Response Headers и Cookies

### Custom headers
```python
# ✅ ПРАВИЛЬНО - custom response headers
from fastapi import Response

@router.get("/items")
async def list_items(response: Response):
    """List items with custom headers."""
    response.headers["X-Custom-Header"] = "Custom Value"
    response.headers["X-Total-Count"] = "100"
    
    return [{"id": 1, "name": "Item"}]

# ✅ ПРАВИЛЬНО - установка cookies
@router.post("/login")
async def login(response: Response, credentials: LoginData):
    """Login and set cookie."""
    token = create_access_token(credentials.username)
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=1800,
        expires=1800,
        secure=True,
        samesite="lax"
    )
    
    return {"message": "Logged in"}

# ✅ ПРАВИЛЬНО - чтение cookies
from fastapi import Cookie

@router.get("/items")
async def read_items(
    session_id: str | None = Cookie(None)
):
    """Read items with session cookie."""
    return {"session_id": session_id}
```

## Error Handling

### Custom exception handlers
```python
# ✅ ПРАВИЛЬНО - кастомные обработчики ошибок
from fastapi import Request
from fastapi.responses import JSONResponse

class ItemNotFoundError(Exception):
    """Item not found exception."""
    
    def __init__(self, item_id: int):
        self.item_id = item_id

@app.exception_handler(ItemNotFoundError)
async def item_not_found_handler(
    request: Request,
    exc: ItemNotFoundError
):
    """Handle item not found errors."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "message": f"Item {exc.item_id} not found"
        }
    )

# Использование
@router.get("/items/{item_id}")
async def get_item(item_id: int):
    """Get item."""
    item = await find_item(item_id)
    if not item:
        raise ItemNotFoundError(item_id)
    return item
```

## Versioning

### API версионирование
```python
# ✅ ПРАВИЛЬНО - версионирование через prefix
from fastapi import APIRouter

# API v1
router_v1 = APIRouter(prefix="/api/v1", tags=["v1"])

@router_v1.get("/users")
async def list_users_v1():
    """List users (v1)."""
    pass

# API v2
router_v2 = APIRouter(prefix="/api/v2", tags=["v2"])

@router_v2.get("/users")
async def list_users_v2():
    """List users (v2) with new fields."""
    pass

# В main.py
app.include_router(router_v1)
app.include_router(router_v2)
```

## Чеклист routes

- [ ] RESTful соглашения для именования
- [ ] Правильные HTTP методы (GET, POST, PUT, DELETE)
- [ ] Правильные status codes
- [ ] Response models для всех endpoints
- [ ] Валидация параметров (Path, Query, Body)
- [ ] Dependencies для переиспользуемой логики
- [ ] Обработка ошибок с HTTPException
- [ ] Документация с docstrings
- [ ] Пагинация для list endpoints
- [ ] Аутентификация и авторизация
