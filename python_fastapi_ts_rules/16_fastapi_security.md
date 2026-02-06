# FastAPI Security - Безопасность

## Общие принципы

- **Defense in Depth** - многоуровневая защита
- **Principle of Least Privilege** - минимальные права
- **Never Trust User Input** - валидация всего
- **Security by Default** - безопасные настройки

## Authentication

### JWT Authentication
```python
# ✅ ПРАВИЛЬНО - JWT аутентификация
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Настройки
SECRET_KEY = "your-secret-key-min-32-chars"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_crud.get(db, id=int(user_id))
    if user is None:
        raise credentials_exception
    
    return user
```

### Login endpoint
```python
# ✅ ПРАВИЛЬНО - безопасный login
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token."""
    # Аутентификация
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверка активности
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Создание токена
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

async def authenticate_user(
    db: AsyncSession,
    username: str,
    password: str
) -> User | None:
    """Authenticate user by username and password."""
    user = await user_crud.get_by_email(db, email=username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
```

### Refresh Tokens
```python
# ✅ ПРАВИЛЬНО - refresh token для длительной сессии
from uuid import uuid4

class RefreshToken(Base):
    """Refresh token model."""
    
    __tablename__ = "refresh_tokens"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    expires_at: Mapped[datetime]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

def create_refresh_token(user_id: int) -> str:
    """Create refresh token."""
    token = str(uuid4())
    expires_at = datetime.utcnow() + timedelta(days=30)
    
    refresh_token = RefreshToken(
        token=token,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(refresh_token)
    db.commit()
    
    return token

@router.post("/refresh")
async def refresh_access_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    # Проверка refresh token
    token_obj = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.token == refresh_token)
        .where(RefreshToken.expires_at > datetime.utcnow())
    )
    token_obj = token_obj.scalar_one_or_none()
    
    if not token_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Создание нового access token
    access_token = create_access_token(data={"sub": str(token_obj.user_id)})
    
    return {"access_token": access_token, "token_type": "bearer"}
```

## Authorization

### Role-Based Access Control (RBAC)
```python
# ✅ ПРАВИЛЬНО - RBAC система
from enum import Enum

class Role(str, Enum):
    """User roles."""
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

class User(Base):
    """User with role."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str]
    role: Mapped[Role] = mapped_column(default=Role.USER)

# Проверка роли
def require_role(required_role: Role):
    """Dependency to require specific role."""
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        # Иерархия ролей
        role_hierarchy = {
            Role.USER: 1,
            Role.MODERATOR: 2,
            Role.ADMIN: 3
        }
        
        if role_hierarchy[current_user.role] < role_hierarchy[required_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        return current_user
    
    return role_checker

# Использование
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Delete user (admin only)."""
    await user_crud.remove(db, id=user_id)
    return {"message": "User deleted"}
```

### Permission-Based Access Control
```python
# ✅ ПРАВИЛЬНО - гранулярные права доступа
class Permission(str, Enum):
    """System permissions."""
    READ_USERS = "read:users"
    WRITE_USERS = "write:users"
    DELETE_USERS = "delete:users"
    READ_POSTS = "read:posts"
    WRITE_POSTS = "write:posts"

# Many-to-many: User <-> Permission
user_permissions = Table(
    "user_permissions",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("permission", String(50))
)

class User(Base):
    """User with permissions."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    permissions: Mapped[list[str]] = relationship(
        secondary=user_permissions
    )

def require_permission(permission: Permission):
    """Dependency to require specific permission."""
    async def permission_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission {permission} required"
            )
        return current_user
    
    return permission_checker

# Использование
@router.post("/users")
async def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_permission(Permission.WRITE_USERS)),
    db: AsyncSession = Depends(get_db)
):
    """Create user (requires write:users permission)."""
    user = await user_crud.create(db, obj_in=user_in)
    return user
```

## CORS

### CORS Configuration
```python
# ✅ ПРАВИЛЬНО - настройка CORS
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Development
if settings.ENVIRONMENT == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
# Production
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://yourdomain.com",
            "https://www.yourdomain.com"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
        max_age=600,  # Кэширование preflight requests
    )

# ❌ НЕПРАВИЛЬНО - слишком открытый CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Опасно!
    allow_credentials=True,  # С allow_origins=["*"] не работает
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Rate Limiting

### Simple rate limiting
```python
# ✅ ПРАВИЛЬНО - rate limiting
from fastapi import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with rate limiting."""
    # Максимум 5 попыток в минуту
    pass

@router.get("/items")
@limiter.limit("100/hour")
async def list_items(request: Request):
    """List items with rate limiting."""
    pass
```

### Redis-based rate limiting
```python
# ✅ ПРАВИЛЬНО - rate limiting с Redis
from fastapi import HTTPException
import redis
from datetime import timedelta

redis_client = redis.Redis(host='localhost', port=6379, db=0)

async def check_rate_limit(
    user_id: int,
    limit: int = 100,
    window: int = 3600  # 1 hour
) -> None:
    """Check rate limit using Redis."""
    key = f"rate_limit:{user_id}"
    
    # Получить текущее количество запросов
    current = redis_client.get(key)
    
    if current is None:
        # Первый запрос в окне
        redis_client.setex(key, window, 1)
    else:
        current = int(current)
        if current >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        redis_client.incr(key)

@router.get("/api/resource")
async def get_resource(current_user: User = Depends(get_current_user)):
    """Get resource with rate limiting."""
    await check_rate_limit(current_user.id)
    return {"data": "resource"}
```

## Input Validation

### Pydantic validation
```python
# ✅ ПРАВИЛЬНО - строгая валидация (Pydantic v2)
from pydantic import BaseModel, Field, field_validator, EmailStr
import re

class UserCreate(BaseModel):
    """User creation with validation."""

    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern="^[a-zA-Z0-9_]+$"
    )
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    age: int = Field(..., ge=0, le=150)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain special character")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username."""
        if v.lower() in ["admin", "root", "system"]:
            raise ValueError("Reserved username")
        return v
```

### SQL Injection Prevention
```python
# ✅ ПРАВИЛЬНО - параметризованные запросы
from sqlalchemy import select, text

# Всегда используйте параметры
async def search_users(db: AsyncSession, query: str):
    """Search users safely."""
    result = await db.execute(
        select(User).where(User.username.ilike(f"%{query}%"))
    )
    return result.scalars().all()

# Для raw SQL - параметры обязательны
async def custom_query(db: AsyncSession, user_id: int):
    """Execute raw SQL safely."""
    result = await db.execute(
        text("SELECT * FROM users WHERE id = :user_id"),
        {"user_id": user_id}
    )
    return result.all()

# ❌ НЕПРАВИЛЬНО - SQL injection уязвимость!
async def search_users_unsafe(db: AsyncSession, query: str):
    """UNSAFE: SQL injection vulnerability!"""
    result = await db.execute(
        text(f"SELECT * FROM users WHERE username LIKE '%{query}%'")
    )
    return result.all()
```

### XSS Prevention
```python
# ✅ ПРАВИЛЬНО - экранирование пользовательского ввода
from html import escape

def sanitize_html(text: str) -> str:
    """Sanitize HTML content."""
    return escape(text)

@router.post("/posts")
async def create_post(
    title: str,
    content: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create post with sanitized content."""
    post = Post(
        title=sanitize_html(title),
        content=sanitize_html(content),
        author_id=current_user.id
    )
    db.add(post)
    await db.commit()
    return post

# Для rich text - используйте библиотеку
from bleach import clean

ALLOWED_TAGS = ['p', 'b', 'i', 'u', 'a', 'br']
ALLOWED_ATTRIBUTES = {'a': ['href', 'title']}

def sanitize_rich_text(html: str) -> str:
    """Sanitize rich text content."""
    return clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )
```

## HTTPS и Security Headers

### Security Headers Middleware
```python
# ✅ ПРАВИЛЬНО - security headers
from fastapi import Request

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # XSS Protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Strict Transport Security (HTTPS only)
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'"
    )
    
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions Policy
    response.headers["Permissions-Policy"] = (
        "geolocation=(), microphone=(), camera=()"
    )
    
    return response
```

### HTTPS Redirect
```python
# ✅ ПРАВИЛЬНО - принудительный HTTPS
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

## CSRF Protection

### CSRF Token
```python
# ✅ ПРАВИЛЬНО - CSRF защита для форм
from itsdangerous import URLSafeTimedSerializer
from fastapi import Form, HTTPException

serializer = URLSafeTimedSerializer(SECRET_KEY)

def generate_csrf_token(session_id: str) -> str:
    """Generate CSRF token."""
    return serializer.dumps(session_id)

def validate_csrf_token(token: str, session_id: str) -> bool:
    """Validate CSRF token."""
    try:
        data = serializer.loads(token, max_age=3600)
        return data == session_id
    except:
        return False

@router.post("/form-submit")
async def submit_form(
    request: Request,
    csrf_token: str = Form(...),
    data: str = Form(...)
):
    """Handle form submission with CSRF protection."""
    session_id = request.cookies.get("session_id")
    
    if not validate_csrf_token(csrf_token, session_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token"
        )
    
    # Process form
    return {"message": "Success"}
```

## Secrets Management

### Environment Variables
```python
# ✅ ПРАВИЛЬНО - secrets из переменных окружения
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings."""
    
    # Secrets - НИКОГДА не хардкодите!
    SECRET_KEY: str
    DATABASE_PASSWORD: str
    REDIS_PASSWORD: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    
    # Публичные настройки
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "My API"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()

# ❌ НЕПРАВИЛЬНО - хардкод секретов
SECRET_KEY = "my-secret-key-123"  # НЕ ДЕЛАЙТЕ ТАК!
DATABASE_URL = "postgresql://user:password@localhost/db"  # НЕ ДЕЛАЙТЕ ТАК!
```

### Secret rotation
```python
# ✅ ПРАВИЛЬНО - поддержка ротации секретов
class Settings(BaseSettings):
    """Settings with secret rotation support."""
    
    # Текущий и предыдущий ключи
    SECRET_KEY: str
    OLD_SECRET_KEY: str | None = None
    
    def verify_token(self, token: str) -> dict:
        """Verify token with current or old key."""
        try:
            return jwt.decode(token, self.SECRET_KEY, algorithms=["HS256"])
        except JWTError:
            if self.OLD_SECRET_KEY:
                try:
                    return jwt.decode(
                        token,
                        self.OLD_SECRET_KEY,
                        algorithms=["HS256"]
                    )
                except JWTError:
                    raise
            raise
```

## Audit Logging

### Security event logging
```python
# ✅ ПРАВИЛЬНО - логирование событий безопасности
import logging

security_logger = logging.getLogger("security")

class AuditLog(Base):
    """Audit log model."""
    
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    resource: Mapped[str] = mapped_column(String(100))
    ip_address: Mapped[str] = mapped_column(String(45))
    user_agent: Mapped[str | None]
    success: Mapped[bool]
    details: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

async def log_security_event(
    db: AsyncSession,
    request: Request,
    action: str,
    resource: str,
    user_id: int | None = None,
    success: bool = True,
    details: dict | None = None
):
    """Log security event."""
    # Логирование
    security_logger.info(
        f"{action} on {resource} by user {user_id} - "
        f"{'SUCCESS' if success else 'FAILURE'}"
    )
    
    # Сохранение в БД
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
        success=success,
        details=details
    )
    db.add(audit_log)
    await db.commit()

# Использование
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db)
):
    """Delete user with audit logging."""
    await user_crud.remove(db, id=user_id)
    
    await log_security_event(
        db,
        request,
        action="DELETE_USER",
        resource=f"users/{user_id}",
        user_id=current_user.id,
        success=True
    )
    
    return {"message": "User deleted"}
```

## Security Checklist

### Deployment Checklist
```python
# ✅ ПРАВИЛЬНО - проверка перед деплоем
def check_security_config():
    """Check security configuration before deployment."""
    issues = []
    
    # SECRET_KEY должен быть достаточно длинным
    if len(settings.SECRET_KEY) < 32:
        issues.append("SECRET_KEY too short (min 32 chars)")
    
    # HTTPS в production
    if settings.ENVIRONMENT == "production" and not settings.USE_HTTPS:
        issues.append("HTTPS not enabled in production")
    
    # DEBUG выключен в production
    if settings.ENVIRONMENT == "production" and settings.DEBUG:
        issues.append("DEBUG enabled in production")
    
    # Строгий CORS
    if "*" in settings.ALLOWED_ORIGINS:
        issues.append("CORS allows all origins (*)")
    
    if issues:
        raise RuntimeError(f"Security issues: {', '.join(issues)}")
```

## Чеклист безопасности

- [ ] JWT с надежным SECRET_KEY (>32 символов)
- [ ] Password hashing с bcrypt
- [ ] RBAC или PBAC для авторизации
- [ ] Rate limiting на критичных endpoints
- [ ] CORS настроен строго
- [ ] Валидация всех входных данных
- [ ] Параметризованные SQL запросы
- [ ] XSS защита (экранирование HTML)
- [ ] Security headers (X-Frame-Options, CSP, etc)
- [ ] HTTPS в production
- [ ] CSRF защита для форм
- [ ] Secrets в переменных окружения
- [ ] Audit logging критичных операций
- [ ] Регулярное обновление зависимостей
- [ ] Security testing (OWASP Top 10)
