# Python Naming - Соглашения об именовании

## Общие принципы

- Имена должны быть **описательными** и **понятными**
- Избегайте сокращений, кроме общепринятых
- Используйте английский язык для всех идентификаторов
- Имена должны отражать назначение, а не тип

## Стили именования

| Стиль | Использование | Пример |
|-------|---------------|--------|
| `snake_case` | переменные, функции, методы, модули | `user_name`, `get_user()` |
| `UPPER_SNAKE_CASE` | константы | `MAX_CONNECTIONS` |
| `PascalCase` | классы, type aliases | `UserManager`, `UserId` |
| `_leading_underscore` | приватные атрибуты | `_internal_value` |

## Переменные

### Локальные переменные
```python
# ✅ ПРАВИЛЬНО - snake_case, описательные имена
user_count = 10
total_price = 100.50
is_active = True
has_permission = False

# ❌ НЕПРАВИЛЬНО
userCount = 10      # camelCase не используется
x = 10              # слишком короткое
usr_cnt = 10        # непонятное сокращение
```

### Глобальные переменные (модуль-уровень)
```python
# ✅ ПРАВИЛЬНО - UPPER_SNAKE_CASE для констант модуля
DATABASE_URL = "postgresql://localhost/db"
CACHE_TIMEOUT = 3600
MAX_RETRY_ATTEMPTS = 3

# ⚠️ ИЗБЕГАЙТЕ изменяемых глобальных переменных
# Если необходимо - используйте явное именование
_module_cache: dict[str, Any] = {}  # приватный для модуля
```

### Булевы переменные
```python
# ✅ ПРАВИЛЬНО - используйте is_, has_, can_, should_, was_, will_
is_valid = True
has_access = False
can_edit = True
should_retry = False
was_processed = True
will_expire = False

# ❌ НЕПРАВИЛЬНО
valid = True        # неясно что это булева
access = False      # может быть чем угодно
```

### Коллекции
```python
# ✅ ПРАВИЛЬНО - множественное число для коллекций
users = [user1, user2]
user_ids = {1, 2, 3}
name_to_user = {"john": user1}

# ✅ ПРАВИЛЬНО - описательные имена
active_users = [u for u in users if u.is_active]
pending_orders = get_orders(status="pending")

# ❌ НЕПРАВИЛЬНО
user_list = []      # избыточный суффикс _list
data = {}           # слишком общее
```

### Итераторы и счетчики
```python
# ✅ ПРАВИЛЬНО - короткие имена для простых циклов
for i in range(10):
    pass

for user in users:
    process(user)

for key, value in mapping.items():
    pass

# ✅ ПРАВИЛЬНО - описательные для сложной логики
for user_index, user_data in enumerate(users):
    process_user(user_index, user_data)

# ✅ ПРАВИЛЬНО - _ для игнорируемых значений
for _ in range(3):
    retry()

_, extension = os.path.splitext(filename)

# ❌ НЕПРАВИЛЬНО
for x in users:     # неинформативно
    pass
```

## Функции и методы

### Именование функций
```python
# ✅ ПРАВИЛЬНО - глаголы, описывающие действие
def calculate_total(items: list[Item]) -> float:
    pass

def get_user_by_id(user_id: int) -> User | None:
    pass

def validate_email(email: str) -> bool:
    pass

def send_notification(user: User, message: str) -> None:
    pass

# ❌ НЕПРАВИЛЬНО
def total():            # не ясно что делает
    pass

def user(id):           # существительное, не глагол
    pass

def process(data):      # слишком общее
    pass
```

### Функции возвращающие bool
```python
# ✅ ПРАВИЛЬНО - начинайте с is_, has_, can_, should_
def is_valid(value: str) -> bool:
    return bool(value)

def has_permission(user: User, action: str) -> bool:
    return action in user.permissions

def can_access(user: User, resource: str) -> bool:
    return user.role == "admin"

def should_retry(error: Exception) -> bool:
    return isinstance(error, RetryableError)

# ❌ НЕПРАВИЛЬНО
def check_valid(value: str) -> bool:    # check_ неоднозначно
    return bool(value)

def validate(value: str) -> bool:        # validate может raise
    return bool(value)
```

### Async функции
```python
# ✅ ПРАВИЛЬНО - async функции именуются так же
async def fetch_user(user_id: int) -> User:
    pass

async def get_all_users() -> list[User]:
    pass

# ✅ ПРАВИЛЬНО - можно добавить async суффикс если есть синхронный аналог
def get_user(user_id: int) -> User:
    pass

async def get_user_async(user_id: int) -> User:
    pass
```

### Приватные методы
```python
# ✅ ПРАВИЛЬНО - один underscore для internal
class UserService:
    def get_user(self, user_id: int) -> User:
        """Public API method."""
        return self._fetch_from_db(user_id)

    def _fetch_from_db(self, user_id: int) -> User:
        """Internal implementation detail."""
        pass

    def _validate_user_id(self, user_id: int) -> None:
        """Internal validation."""
        pass

# ⚠️ Двойной underscore - только для name mangling (редко нужно)
class Base:
    def __init__(self):
        self.__private = 1  # Становится _Base__private
```

### Dunder методы
```python
# ✅ ПРАВИЛЬНО - используйте только стандартные dunder методы
class User:
    def __init__(self, name: str) -> None:
        self.name = name

    def __str__(self) -> str:
        return f"User({self.name})"

    def __repr__(self) -> str:
        return f"User(name={self.name!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, User):
            return NotImplemented
        return self.name == other.name

    def __hash__(self) -> int:
        return hash(self.name)

# ❌ НЕПРАВИЛЬНО - не создавайте свои dunder методы
class User:
    def __custom_method__(self):    # НЕ ДЕЛАЙТЕ ТАК
        pass
```

## Классы

### Именование классов
```python
# ✅ ПРАВИЛЬНО - PascalCase, существительные
class User: pass
class UserManager: pass
class DatabaseConnection: pass
class HTTPClient: pass              # Аббревиатуры в верхнем регистре
class XMLParser: pass

# ❌ НЕПРАВИЛЬНО
class user: pass                    # не PascalCase
class Manage_User: pass             # snake_case в классах
class IUserManager: pass            # I-префиксы интерфейсов не используются
class UserClass: pass               # избыточный суффикс Class
```

### Абстрактные базовые классы
```python
from abc import ABC, abstractmethod

# ✅ ПРАВИЛЬНО - суффикс Base или без него
class BaseRepository(ABC):
    @abstractmethod
    def save(self, entity: Entity) -> None: pass

# ✅ ПРАВИЛЬНО - если контекст понятен
class Repository(ABC):
    @abstractmethod
    def save(self, entity: Entity) -> None: pass

# ✅ ПРАВИЛЬНО - префикс Abstract для явности
class AbstractValidator(ABC):
    @abstractmethod
    def validate(self, data: Any) -> bool: pass
```

### Protocol классы (structural subtyping)
```python
from typing import Protocol

# ✅ ПРАВИЛЬНО - Protocol классы как обычные классы
class Readable(Protocol):
    def read(self) -> bytes: ...

class Writable(Protocol):
    def write(self, data: bytes) -> None: ...

# ✅ ПРАВИЛЬНО - комбинированные протоколы
class ReadWritable(Readable, Writable, Protocol):
    pass

# ✅ ПРАВИЛЬНО - callable протоколы
class Handler(Protocol):
    def __call__(self, request: Request) -> Response: ...
```

### Dataclasses
```python
from dataclasses import dataclass

# ✅ ПРАВИЛЬНО - обычное именование классов
@dataclass
class UserConfig:
    username: str
    email: str
    is_active: bool = True

@dataclass(frozen=True)
class Point:
    x: float
    y: float

@dataclass(slots=True)
class CacheEntry:
    key: str
    value: Any
    expires_at: datetime
```

### Исключения
```python
# ✅ ПРАВИЛЬНО - суффикс Error (предпочтительно) или Exception
class ValidationError(Exception):
    """Raised when validation fails."""
    pass

class DatabaseConnectionError(Exception):
    """Raised when database connection fails."""
    pass

class UserNotFoundError(Exception):
    """Raised when user is not found."""
    pass

# ✅ ПРАВИЛЬНО - с контекстом
class AuthenticationError(Exception):
    """Base for authentication errors."""
    pass

class InvalidTokenError(AuthenticationError):
    """Raised when token is invalid."""
    pass

class TokenExpiredError(AuthenticationError):
    """Raised when token has expired."""
    pass

# ❌ НЕПРАВИЛЬНО
class InvalidData(Exception): pass          # нет суффикса
class ErrorValidation(Exception): pass      # неправильный порядок
```

### Миксины
```python
# ✅ ПРАВИЛЬНО - суффикс Mixin
class TimestampMixin:
    created_at: datetime
    updated_at: datetime

class SerializableMixin:
    def to_dict(self) -> dict[str, Any]:
        pass

class LoggableMixin:
    def log(self, message: str) -> None:
        pass

# ✅ ПРАВИЛЬНО - использование
class User(TimestampMixin, SerializableMixin, Base):
    pass
```

## Константы

### Глобальные константы
```python
# ✅ ПРАВИЛЬНО - UPPER_SNAKE_CASE в начале модуля
MAX_RETRY_ATTEMPTS = 3
DEFAULT_TIMEOUT = 30
API_BASE_URL = "https://api.example.com"
SUPPORTED_FORMATS = frozenset({"json", "xml", "yaml"})

# ✅ ПРАВИЛЬНО - Final для type checkers
from typing import Final

MAX_CONNECTIONS: Final = 100
API_VERSION: Final[str] = "v1"
```

### Enum
```python
from enum import Enum, auto, StrEnum

# ✅ ПРАВИЛЬНО - PascalCase для класса, UPPER_CASE для членов
class Status(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"

# ✅ ПРАВИЛЬНО - auto() для автоматических значений
class Priority(Enum):
    LOW = auto()
    MEDIUM = auto()
    HIGH = auto()

# ✅ ПРАВИЛЬНО - StrEnum для строковых enum (Python 3.11+)
class Color(StrEnum):
    RED = "red"
    GREEN = "green"
    BLUE = "blue"
```

## Type Hints и Аннотации

### Type Aliases (Python 3.12+)
```python
# ✅ ПРАВИЛЬНО - type statement (Python 3.12+)
type UserId = int
type UserDict = dict[str, str | int]
type Handler = Callable[[Request], Response]
type JSON = dict[str, "JSON"] | list["JSON"] | str | int | float | bool | None

# ✅ ПРАВИЛЬНО - TypeAlias для старых версий
from typing import TypeAlias

UserId: TypeAlias = int
UserDict: TypeAlias = dict[str, str | int]

# ❌ НЕПРАВИЛЬНО
user_id = int                   # выглядит как переменная
RESPONSE_DATA = dict[str, Any]  # константа, не тип
```

### TypeVar (Python 3.12+)
```python
# ✅ ПРАВИЛЬНО - новый синтаксис (Python 3.12+)
def first[T](items: list[T]) -> T | None:
    return items[0] if items else None

def get_or_default[T](value: T | None, default: T) -> T:
    return value if value is not None else default

class Container[T]:
    def __init__(self, value: T) -> None:
        self.value = value

# ✅ ПРАВИЛЬНО - с constraints
def process[T: (str, bytes)](data: T) -> T:
    return data

# ✅ ПРАВИЛЬНО - старый синтаксис (если нужна совместимость)
from typing import TypeVar

T = TypeVar("T")
UserT = TypeVar("UserT", bound="User")
```

### Generic классы (Python 3.12+)
```python
# ✅ ПРАВИЛЬНО - новый синтаксис
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

# ✅ ПРАВИЛЬНО - несколько параметров
class Mapping[K, V]:
    def get(self, key: K) -> V | None:
        pass

# ✅ ПРАВИЛЬНО - с constraints
class Repository[T: Entity]:
    def save(self, entity: T) -> None:
        pass
```

## Модули и пакеты

### Имена модулей
```python
# ✅ ПРАВИЛЬНО - короткие, snake_case, без дефисов
# user_manager.py
# database.py
# api_client.py
# utils.py

# ❌ НЕПРАВИЛЬНО
# UserManager.py     - PascalCase
# user-manager.py    - дефисы не разрешены
# usrmngr.py         - непонятные сокращения
```

### Структура пакетов
```
# ✅ ПРАВИЛЬНО
app/
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── order.py
├── services/
│   ├── __init__.py
│   ├── user_service.py
│   └── order_service.py
├── repositories/
│   ├── __init__.py
│   └── user_repository.py
└── utils/
    ├── __init__.py
    ├── validators.py
    └── formatters.py

# ❌ НЕПРАВИЛЬНО
app/
├── Models/          # PascalCase
├── user-service/    # дефисы
└── Utils/           # PascalCase
```

## FastAPI специфика

### Route handlers
```python
# ✅ ПРАВИЛЬНО - CRUD паттерн именования
@router.get("/users")
async def list_users() -> list[UserResponse]:
    pass

@router.post("/users", status_code=201)
async def create_user(data: UserCreate) -> UserResponse:
    pass

@router.get("/users/{user_id}")
async def get_user(user_id: int) -> UserResponse:
    pass

@router.put("/users/{user_id}")
async def update_user(user_id: int, data: UserUpdate) -> UserResponse:
    pass

@router.patch("/users/{user_id}")
async def partial_update_user(user_id: int, data: UserPatch) -> UserResponse:
    pass

@router.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: int) -> None:
    pass
```

### Pydantic модели
```python
from pydantic import BaseModel, ConfigDict

# ✅ ПРАВИЛЬНО - суффиксы указывают назначение
class UserBase(BaseModel):
    """Base user fields."""
    username: str
    email: str

class UserCreate(UserBase):
    """Fields for creating a user."""
    password: str

class UserUpdate(BaseModel):
    """Fields for updating a user (all optional)."""
    username: str | None = None
    email: str | None = None

class UserResponse(UserBase):
    """User response (public fields)."""
    id: int

    model_config = ConfigDict(from_attributes=True)

class UserInDB(UserBase):
    """User as stored in database."""
    id: int
    hashed_password: str

# ❌ НЕПРАВИЛЬНО
class User(BaseModel): pass         # не ясно для чего
class UserModel(BaseModel): pass    # избыточный суффикс Model
class UserSchema(BaseModel): pass   # Schema устарело
```

### Dependency functions
```python
from typing import Annotated
from fastapi import Depends

# ✅ ПРАВИЛЬНО - get_ префикс для зависимостей
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    pass

async def get_current_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_active:
        raise HTTPException(status_code=400)
    return user

# ✅ ПРАВИЛЬНО - require_ для проверок
async def require_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403)
    return user

# ✅ ПРАВИЛЬНО - Type aliases для Annotated
DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin)]

# Использование
@router.get("/users")
async def list_users(db: DB, user: AdminUser) -> list[UserResponse]:
    pass
```

## Специальные случаи

### Избегайте затенения встроенных имен
```python
# ❌ НЕПРАВИЛЬНО - затеняет встроенные
id = 1
type = "user"
list = [1, 2, 3]
dict = {"key": "value"}
str = "text"
input = "data"
format = "json"

# ✅ ПРАВИЛЬНО - альтернативные имена
user_id = 1
user_type = "user"
items = [1, 2, 3]
data = {"key": "value"}
text = "text"
user_input = "data"
output_format = "json"
```

### Общепринятые сокращения
```python
# ✅ ПРАВИЛЬНО - широко известные сокращения
db = Database()
api = APIClient()
http = HTTPClient()
url = "https://example.com"
html = "<div>content</div>"
json_data = load_json()
config = Config()
env = Environment()
ctx = context                   # в очевидном контексте
req, res = request, response    # в обработчиках
err = error                     # в except блоках

# ❌ НЕПРАВИЛЬНО - непонятные сокращения
usr_mgr = UserManager()
conn_cfg = ConnectionConfig()
val_res = validation_result()
proc_dat = processed_data()
```

## Инструменты проверки

### Ruff (рекомендуется)
```bash
# Проверка именования
ruff check --select=N .

# Все правила именования
# N801 - class name should use CapWords
# N802 - function name should be lowercase
# N803 - argument name should be lowercase
# N804 - first argument of classmethod should be cls
# N805 - first argument of method should be self
# N806 - variable in function should be lowercase
```

### Конфигурация pyproject.toml
```toml
[tool.ruff.lint]
select = [
    "N",      # pep8-naming
]

[tool.ruff.lint.pep8-naming]
classmethod-decorators = ["classmethod", "pydantic.validator"]
staticmethod-decorators = ["staticmethod"]
```

## Чеклист

- [ ] Все имена на английском языке
- [ ] Используется snake_case для функций и переменных
- [ ] Используется PascalCase для классов и type aliases
- [ ] Используется UPPER_SNAKE_CASE для констант
- [ ] Булевы переменные начинаются с is_, has_, can_, should_
- [ ] Функции начинаются с глаголов
- [ ] Классы-исключения заканчиваются на Error
- [ ] Приватные методы начинаются с _
- [ ] Type aliases используют `type` statement (Python 3.12+)
- [ ] Generics используют новый синтаксис `[T]` (Python 3.12+)
- [ ] Не затеняются встроенные имена Python
- [ ] Pydantic модели имеют суффиксы (Create, Update, Response)
