# Python Functions - Функции

## Общие принципы

- Функция должна делать **одно дело** и делать его хорошо
- Имя функции должно четко описывать что она делает
- Функции должны быть **короткими** и **понятными**
- Избегайте побочных эффектов
- **Всегда** используйте type hints

## Определение функций

### Базовый синтаксис
```python
# ✅ ПРАВИЛЬНО - четкое имя, type hints, docstring
def calculate_total(items: list[dict[str, float]]) -> float:
    """Calculate total price of all items.

    Args:
        items: List of item dictionaries with 'price' key.

    Returns:
        Total price as float.
    """
    return sum(item["price"] for item in items)

# ❌ НЕПРАВИЛЬНО - нет типов, нет docstring
def calc(items):
    return sum(item["price"] for item in items)
```

### Пустые строки
```python
# ✅ ПРАВИЛЬНО - 2 пустые строки между функциями верхнего уровня
def function_one() -> None:
    pass


def function_two() -> None:
    pass


class MyClass:
    # 1 пустая строка между методами
    def method_one(self) -> None:
        pass

    def method_two(self) -> None:
        pass
```

## Аргументы функций

### Позиционные аргументы
```python
# ✅ ПРАВИЛЬНО - понятные имена, не более 3-4 позиционных
def create_user(username: str, email: str, age: int) -> User:
    return User(username=username, email=email, age=age)

# ❌ НЕПРАВИЛЬНО - слишком много позиционных аргументов
def create_user(un, em, age, city, country, zip_code, phone):
    pass
```

### Аргументы по умолчанию
```python
# ✅ ПРАВИЛЬНО - None для изменяемых значений
def create_connection(
    host: str,
    port: int = 5432,
    options: dict[str, str] | None = None,
) -> Connection:
    if options is None:
        options = {}
    return Connection(host, port, **options)

# ❌ НЕПРАВИЛЬНО - изменяемое значение по умолчанию
def create_connection(
    host: str,
    port: int = 5432,
    options: dict[str, str] = {},  # BUG! Shared between calls
) -> Connection:
    return Connection(host, port, **options)
```

### Keyword-only аргументы
```python
# ✅ ПРАВИЛЬНО - * для keyword-only аргументов
def create_user(
    username: str,
    email: str,
    *,  # Все после * - только keyword
    is_active: bool = True,
    role: str = "user",
    send_welcome_email: bool = True,
) -> User:
    return User(username, email, is_active, role)

# Использование - нельзя перепутать порядок
user = create_user("john", "john@example.com", is_active=True, role="admin")

# ❌ Ошибка компиляции
# user = create_user("john", "john@example.com", True, "admin")
```

### Positional-only аргументы
```python
# ✅ ПРАВИЛЬНО - / для positional-only (Python 3.8+)
def divide(x: float, y: float, /) -> float:
    """Division where argument names don't matter."""
    return x / y

result = divide(10, 2)  # OK

# ❌ Ошибка
# result = divide(x=10, y=2)  # TypeError

# ✅ ПРАВИЛЬНО - комбинация positional-only, regular, keyword-only
def process(
    x: int,           # positional-only
    y: int,           # positional-only
    /,
    z: int,           # regular (positional or keyword)
    *,
    flag: bool = False,  # keyword-only
) -> int:
    return x + y + z
```

### *args и **kwargs
```python
# ✅ ПРАВИЛЬНО - когда количество аргументов неизвестно
def log_message(level: str, *args: object, **kwargs: object) -> None:
    """Log message with variable arguments."""
    message = " ".join(str(arg) for arg in args)
    metadata = " ".join(f"{k}={v}" for k, v in kwargs.items())
    print(f"[{level}] {message} {metadata}")

log_message("INFO", "User", "logged in", user_id=123, ip="127.0.0.1")

# ✅ ПРАВИЛЬНО - делегирование аргументов
def wrapper(*args: object, **kwargs: object) -> object:
    """Wrapper that passes all args to another function."""
    prepare()
    result = original_function(*args, **kwargs)
    cleanup()
    return result
```

### Ограничение количества аргументов
```python
# ✅ ПРАВИЛЬНО - не более 5 аргументов
def send_email(
    to: str,
    subject: str,
    body: str,
    *,
    cc: str | None = None,
    attachment: Path | None = None,
) -> None:
    pass

# ❌ НЕПРАВИЛЬНО - слишком много аргументов
def send_email(to, subject, body, cc, bcc, reply_to, attachment, priority, ...):
    pass

# ✅ ПРАВИЛЬНО - используйте dataclass/TypedDict для многих параметров
from dataclasses import dataclass

@dataclass
class EmailConfig:
    to: str
    subject: str
    body: str
    cc: str | None = None
    bcc: str | None = None
    reply_to: str | None = None
    attachment: Path | None = None
    priority: str = "normal"

def send_email(config: EmailConfig) -> None:
    pass
```

## Возвращаемые значения

### Явный return
```python
# ✅ ПРАВИЛЬНО - всегда явный return
def get_user(user_id: int) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    return user

def is_valid(value: str) -> bool:
    if not value:
        return False
    return len(value) > 3

# ✅ ПРАВИЛЬНО - None return для процедур
def log_event(event: str) -> None:
    logger.info(event)
    return None  # Можно опустить, но явно показывает намерение
```

### Множественные возвращаемые значения
```python
# ✅ ПРАВИЛЬНО - NamedTuple для структурированных данных
from typing import NamedTuple

class UserResult(NamedTuple):
    user: User
    is_new: bool
    errors: list[str]

def get_or_create_user(email: str) -> UserResult:
    user = db.query(User).filter(User.email == email).first()

    if user:
        return UserResult(user=user, is_new=False, errors=[])

    user = User(email=email)
    return UserResult(user=user, is_new=True, errors=[])

# Использование с распаковкой
result = get_or_create_user("test@example.com")
print(result.user, result.is_new)

# ✅ ПРАВИЛЬНО - простой tuple для 2 значений
def split_name(full_name: str) -> tuple[str, str]:
    """Split full name into first and last name."""
    parts = full_name.split(" ", 1)
    return parts[0], parts[1] if len(parts) > 1 else ""

first, last = split_name("John Doe")
```

### Ранний return (Guard Clauses)
```python
# ✅ ПРАВИЛЬНО - проверки в начале, ранний return
def process_user(user: User | None) -> dict[str, str]:
    if user is None:
        return {"error": "User not found"}

    if not user.is_active:
        return {"error": "User is inactive"}

    if not user.has_permission("read"):
        return {"error": "Permission denied"}

    # Основная логика (без вложенности)
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
    }

# ❌ НЕПРАВИЛЬНО - глубокая вложенность
def process_user(user: User | None) -> dict[str, str]:
    if user is not None:
        if user.is_active:
            if user.has_permission("read"):
                return {"id": str(user.id), "name": user.name}
            else:
                return {"error": "Permission denied"}
        else:
            return {"error": "User is inactive"}
    else:
        return {"error": "User not found"}
```

## Type Hints

### Базовые типы
```python
# ✅ ПРАВИЛЬНО - всегда используйте type hints
def greet(name: str) -> str:
    return f"Hello, {name}!"

def add(a: int, b: int) -> int:
    return a + b

def calculate_average(numbers: list[float]) -> float:
    return sum(numbers) / len(numbers)

def is_valid(value: str) -> bool:
    return len(value) > 0
```

### Union и Optional
```python
# ✅ ПРАВИЛЬНО - Python 3.10+ синтаксис
def get_user(user_id: int) -> User | None:
    return db.query(User).get(user_id)

def process_value(value: int | str | float) -> str:
    return str(value)

# ✅ ПРАВИЛЬНО - несколько None-able параметров
def search(
    query: str,
    limit: int | None = None,
    offset: int | None = None,
) -> list[Result]:
    pass
```

### Коллекции
```python
# ✅ ПРАВИЛЬНО - встроенные generic типы (Python 3.9+)
def process_items(items: list[dict[str, int]]) -> list[str]:
    return [str(item["value"]) for item in items]

def count_words(text: str) -> dict[str, int]:
    words = text.split()
    return {word: words.count(word) for word in set(words)}

def get_unique(items: set[str]) -> frozenset[str]:
    return frozenset(items)

# ✅ ПРАВИЛЬНО - collections.abc для абстрактных типов
from collections.abc import Sequence, Mapping, Iterable

def process_sequence(items: Sequence[int]) -> int:
    """Works with list, tuple, or any sequence."""
    return sum(items)

def process_mapping(data: Mapping[str, int]) -> list[str]:
    """Works with dict or any mapping."""
    return list(data.keys())
```

### Callable
```python
from collections.abc import Callable

# ✅ ПРАВИЛЬНО - функция как параметр
def apply_operation(
    value: int,
    operation: Callable[[int], int],
) -> int:
    return operation(value)

result = apply_operation(5, lambda x: x * 2)

# ✅ ПРАВИЛЬНО - callback с несколькими параметрами
def on_event(
    callback: Callable[[str, dict[str, str]], None],
) -> None:
    callback("event", {"key": "value"})

# ✅ ПРАВИЛЬНО - callable без ограничений
def execute(func: Callable[..., int]) -> int:
    return func()
```

### Generic функции (Python 3.12+)
```python
# ✅ ПРАВИЛЬНО - новый синтаксис generic (Python 3.12+)
def first[T](items: list[T]) -> T | None:
    """Return first element or None."""
    return items[0] if items else None

def get_or_default[T](value: T | None, default: T) -> T:
    """Return value if not None, else default."""
    return value if value is not None else default

# Автоматический вывод типа
number = first([1, 2, 3])       # int | None
text = first(["a", "b"])        # str | None
result = get_or_default(None, 0)  # int

# ✅ ПРАВИЛЬНО - с constraints
def stringify[T: (int, float, str)](value: T) -> str:
    """Convert numeric or string to string."""
    return str(value)

# ✅ ПРАВИЛЬНО - несколько type parameters
def zip_with[T, U, V](
    items1: list[T],
    items2: list[U],
    func: Callable[[T, U], V],
) -> list[V]:
    return [func(a, b) for a, b in zip(items1, items2)]
```

### @overload для разных сигнатур
```python
from typing import overload

# ✅ ПРАВИЛЬНО - разные возвращаемые типы в зависимости от аргументов
@overload
def get_item(index: int) -> str: ...

@overload
def get_item(index: slice) -> list[str]: ...

def get_item(index: int | slice) -> str | list[str]:
    items = ["a", "b", "c", "d"]
    return items[index]

# Использование - type checker знает точный тип
item: str = get_item(0)
items: list[str] = get_item(slice(0, 2))

# ✅ ПРАВИЛЬНО - Optional параметр меняет возвращаемый тип
@overload
def find_user(user_id: int) -> User: ...

@overload
def find_user(user_id: int, default: User) -> User: ...

@overload
def find_user(user_id: int, default: None) -> User | None: ...

def find_user(user_id: int, default: User | None = None) -> User | None:
    user = db.get(user_id)
    if user is None:
        if default is None:
            raise UserNotFoundError(user_id)
        return default
    return user
```

## Декораторы

### Базовый декоратор с правильной типизацией
```python
from functools import wraps
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

# ✅ ПРАВИЛЬНО - сохраняет сигнатуру функции
def log_execution(func: Callable[P, R]) -> Callable[P, R]:
    """Decorator to log function execution."""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Executing {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Finished {func.__name__}")
        return result
    return wrapper

@log_execution
def calculate(x: int, y: int) -> int:
    return x + y

# Type checker знает: calculate(x: int, y: int) -> int
```

### Декоратор с параметрами
```python
from functools import wraps
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

# ✅ ПРАВИЛЬНО - параметризованный декоратор
def retry(max_attempts: int = 3, delay: float = 1.0):
    """Retry decorator with configurable attempts."""
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            last_error: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        time.sleep(delay)
            raise last_error  # type: ignore
        return wrapper
    return decorator

@retry(max_attempts=5, delay=0.5)
def fetch_data(url: str) -> dict[str, str]:
    return requests.get(url).json()
```

### Async декоратор
```python
from functools import wraps
from typing import ParamSpec, TypeVar
from collections.abc import Awaitable, Callable

P = ParamSpec("P")
R = TypeVar("R")

def async_retry(max_attempts: int = 3):
    """Async retry decorator."""
    def decorator(
        func: Callable[P, Awaitable[R]]
    ) -> Callable[P, Awaitable[R]]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    await asyncio.sleep(1)
            raise RuntimeError("Unreachable")
        return wrapper
    return decorator

@async_retry(max_attempts=3)
async def fetch_user(user_id: int) -> User:
    return await api.get_user(user_id)
```

## Lambda функции

```python
# ✅ ПРАВИЛЬНО - простые однострочные выражения
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

# ✅ ПРАВИЛЬНО - сортировка с key
users = [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]
sorted_users = sorted(users, key=lambda u: u["age"])

# ✅ ПРАВИЛЬНО - list comprehension часто лучше
squared = [x ** 2 for x in numbers]
evens = [x for x in numbers if x % 2 == 0]

# ❌ НЕПРАВИЛЬНО - сложная логика в lambda
result = list(map(
    lambda x: x * 2 if x > 0 else x / 2 if x < 0 else 0,
    numbers
))

# ✅ ПРАВИЛЬНО - обычная функция для сложной логики
def transform(x: int) -> float:
    if x > 0:
        return x * 2
    elif x < 0:
        return x / 2
    return 0

result = list(map(transform, numbers))
```

## Async функции

### Определение async функций
```python
# ✅ ПРАВИЛЬНО - async def для асинхронных операций
async def fetch_user(user_id: int) -> User:
    """Fetch user asynchronously from database."""
    async with db.session() as session:
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

# ✅ ПРАВИЛЬНО - await для вызова async функций
async def get_user_with_orders(user_id: int) -> dict[str, object]:
    user = await fetch_user(user_id)
    orders = await fetch_orders(user_id)
    return {"user": user, "orders": orders}
```

### Async generators
```python
from collections.abc import AsyncIterator

# ✅ ПРАВИЛЬНО - async generator
async def stream_users(batch_size: int = 100) -> AsyncIterator[User]:
    """Stream users from database in batches."""
    offset = 0
    while True:
        users = await fetch_users(limit=batch_size, offset=offset)
        if not users:
            break
        for user in users:
            yield user
        offset += batch_size

# Использование
async for user in stream_users():
    await process(user)
```

## Чистые функции

### Без побочных эффектов
```python
# ✅ ПРАВИЛЬНО - чистая функция
def calculate_tax(amount: float, rate: float) -> float:
    """Pure function: same input always gives same output."""
    return amount * rate

# ❌ НЕПРАВИЛЬНО - побочные эффекты
total = 0

def add_to_total(amount: float) -> None:
    global total
    total += amount  # Изменяет глобальное состояние
```

### Иммутабельность
```python
# ✅ ПРАВИЛЬНО - возвращает новую коллекцию
def add_item(items: list[str], item: str) -> list[str]:
    """Return new list with added item."""
    return [*items, item]

def update_dict(data: dict[str, int], key: str, value: int) -> dict[str, int]:
    """Return new dict with updated key."""
    return {**data, key: value}

# ❌ НЕПРАВИЛЬНО - мутирует входные данные
def add_item(items: list[str], item: str) -> list[str]:
    items.append(item)  # Изменяет оригинальный список!
    return items

# ⚠️ Если мутация нужна - сделайте это явным
def add_item_inplace(items: list[str], item: str) -> None:
    """Add item to list in-place. Modifies the original list."""
    items.append(item)
```

## FastAPI специфика

### Route handlers
```python
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()

# ✅ ПРАВИЛЬНО - Annotated dependencies (FastAPI 0.95+)
@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get user by ID."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", status_code=201)
async def create_user(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """Create new user."""
    user = User(**user_data.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
```

### Dependency functions
```python
from typing import Annotated, AsyncGenerator
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Database session dependency."""
    async with async_session() as session:
        yield session

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get current authenticated user."""
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# ✅ ПРАВИЛЬНО - Type aliases для чистоты кода
DB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

@router.get("/me")
async def get_me(user: CurrentUser) -> UserResponse:
    return user
```

## Docstrings

### Google Style (рекомендуется)
```python
def calculate_total(
    items: list[dict[str, float]],
    discount: float = 0.0,
    tax_rate: float = 0.0,
) -> float:
    """Calculate total price with discount and tax.

    Args:
        items: List of items with 'price' key.
        discount: Discount percentage (0.0 to 1.0).
        tax_rate: Tax rate (0.0 to 1.0).

    Returns:
        Total price after discount and tax.

    Raises:
        ValueError: If discount or tax_rate is negative.

    Examples:
        >>> items = [{"price": 100}, {"price": 200}]
        >>> calculate_total(items, discount=0.1)
        270.0
    """
    if discount < 0 or tax_rate < 0:
        raise ValueError("Discount and tax rate must be non-negative")

    subtotal = sum(item["price"] for item in items)
    after_discount = subtotal * (1 - discount)
    total = after_discount * (1 + tax_rate)
    return total
```

### Однострочный docstring
```python
def get_username(user: User) -> str:
    """Return the username of the user."""
    return user.username
```

## Чеклист

- [ ] Функция делает одно дело
- [ ] Имя функции - глагол, описывающий действие
- [ ] Type hints для всех параметров и возвращаемого значения
- [ ] Docstring для публичных функций
- [ ] Не более 5 параметров
- [ ] Keyword-only аргументы для булевых флагов (`*`)
- [ ] Нет изменяемых значений по умолчанию
- [ ] Функция не длиннее 30-50 строк
- [ ] Ранний return для проверок (guard clauses)
- [ ] Нет глобальных переменных и побочных эффектов
- [ ] Generic функции используют новый синтаксис `[T]` (Python 3.12+)
- [ ] Декораторы используют `ParamSpec` для сохранения типов
