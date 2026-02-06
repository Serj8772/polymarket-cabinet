# Python Classes - Классы и ООП

## Общие принципы

- Классы должны иметь **единственную ответственность** (SRP)
- Используйте **композицию** вместо наследования когда возможно
- Предпочитайте **явное** над неявным
- Используйте **dataclasses** для структур данных
- Используйте **Protocol** для duck typing

## Определение классов

### Базовый синтаксис
```python
from typing import Self

# ✅ ПРАВИЛЬНО - PascalCase, docstring, type hints
class User:
    """User model representing an application user.

    Attributes:
        username: Unique username.
        email: User's email address.
        is_active: Whether the user account is active.
    """

    def __init__(self, username: str, email: str) -> None:
        self.username = username
        self.email = email
        self.is_active = True

    def activate(self) -> None:
        """Activate the user account."""
        self.is_active = True

    def with_email(self, email: str) -> Self:
        """Return copy with new email."""
        return type(self)(self.username, email)
```

### Атрибуты класса vs экземпляра
```python
# ✅ ПРАВИЛЬНО - четкое разделение
class User:
    # Атрибуты класса (общие для всех экземпляров)
    default_role: str = "user"
    _user_count: int = 0

    def __init__(self, username: str) -> None:
        # Атрибуты экземпляра (уникальны для каждого)
        self.username = username
        self.role = self.default_role
        self.permissions: list[str] = []  # Mutable - только как instance!
        User._user_count += 1

# ❌ НЕПРАВИЛЬНО - mutable class attribute
class User:
    permissions: list[str] = []  # BUG! Shared between all instances!
```

### Properties
```python
from typing import Self

class Rectangle:
    """Rectangle with computed properties."""

    def __init__(self, width: float, height: float) -> None:
        self._width = width
        self._height = height

    @property
    def width(self) -> float:
        """Get rectangle width."""
        return self._width

    @width.setter
    def width(self, value: float) -> None:
        """Set rectangle width with validation."""
        if value <= 0:
            raise ValueError("Width must be positive")
        self._width = value

    @property
    def area(self) -> float:
        """Calculate rectangle area (read-only)."""
        return self._width * self._height

    @property
    def perimeter(self) -> float:
        """Calculate perimeter (read-only)."""
        return 2 * (self._width + self._height)

# Использование
rect = Rectangle(10, 5)
print(rect.area)      # 50
rect.width = 20       # Uses setter
# rect.area = 100     # Error - no setter
```

## Методы класса

### Instance, Class и Static методы
```python
from typing import Self
from datetime import datetime
import json

class User:
    """User with different method types."""

    def __init__(self, username: str, email: str) -> None:
        self.username = username
        self.email = email
        self.created_at = datetime.now()

    # Instance method - operates on self
    def greet(self) -> str:
        """Return greeting message."""
        return f"Hello, {self.username}!"

    # Class method - factory method pattern
    @classmethod
    def from_dict(cls, data: dict[str, str]) -> Self:
        """Create User from dictionary."""
        return cls(
            username=data["username"],
            email=data["email"],
        )

    @classmethod
    def from_json(cls, json_str: str) -> Self:
        """Create User from JSON string."""
        data = json.loads(json_str)
        return cls.from_dict(data)

    # Static method - utility function
    @staticmethod
    def validate_email(email: str) -> bool:
        """Check if email is valid."""
        return "@" in email and "." in email

# Использование
user = User.from_dict({"username": "john", "email": "john@example.com"})
is_valid = User.validate_email("test@example.com")
```

### typing.Self для fluent interface
```python
from typing import Self

class QueryBuilder:
    """SQL query builder with fluent interface."""

    def __init__(self) -> None:
        self._table: str = ""
        self._conditions: list[str] = []
        self._limit: int | None = None

    def from_table(self, table: str) -> Self:
        """Set table name."""
        self._table = table
        return self

    def where(self, condition: str) -> Self:
        """Add WHERE condition."""
        self._conditions.append(condition)
        return self

    def limit(self, n: int) -> Self:
        """Set LIMIT."""
        self._limit = n
        return self

    def build(self) -> str:
        """Build SQL query."""
        query = f"SELECT * FROM {self._table}"
        if self._conditions:
            query += " WHERE " + " AND ".join(self._conditions)
        if self._limit:
            query += f" LIMIT {self._limit}"
        return query

# Fluent usage
query = (
    QueryBuilder()
    .from_table("users")
    .where("is_active = true")
    .where("age > 18")
    .limit(10)
    .build()
)
```

### Magic methods (dunder methods)
```python
from typing import Self

class Point:
    """2D point with operator overloading."""

    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"Point(x={self.x}, y={self.y})"

    def __str__(self) -> str:
        """User-friendly representation."""
        return f"({self.x}, {self.y})"

    def __eq__(self, other: object) -> bool:
        """Check equality."""
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self) -> int:
        """Make hashable for use in sets/dicts."""
        return hash((self.x, self.y))

    def __add__(self, other: Self) -> Self:
        """Add two points."""
        return type(self)(self.x + other.x, self.y + other.y)

    def __mul__(self, scalar: float) -> Self:
        """Multiply by scalar."""
        return type(self)(self.x * scalar, self.y * scalar)

    def __bool__(self) -> bool:
        """Point is truthy if not at origin."""
        return self.x != 0 or self.y != 0
```

### Context managers
```python
from typing import Self
from types import TracebackType

class DatabaseConnection:
    """Database connection as context manager."""

    def __init__(self, connection_string: str) -> None:
        self.connection_string = connection_string
        self.connection: Connection | None = None

    def __enter__(self) -> Self:
        """Open connection when entering context."""
        self.connection = create_connection(self.connection_string)
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> bool:
        """Close connection when exiting context."""
        if self.connection:
            self.connection.close()
        return False  # Don't suppress exceptions

# Использование
with DatabaseConnection("postgresql://localhost/db") as db:
    result = db.execute("SELECT * FROM users")
```

## Dataclasses

### Базовое использование (Python 3.10+)
```python
from dataclasses import dataclass, field
from datetime import datetime

# ✅ ПРАВИЛЬНО - modern dataclass
@dataclass(slots=True)
class User:
    """User data class with slots for memory optimization."""

    username: str
    email: str
    age: int
    is_active: bool = True
    roles: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        """Validate after initialization."""
        if self.age < 0:
            raise ValueError("Age cannot be negative")
        if not self.email or "@" not in self.email:
            raise ValueError("Invalid email")
```

### Dataclass options
```python
from dataclasses import dataclass, field

# Frozen (immutable)
@dataclass(frozen=True, slots=True)
class Point:
    """Immutable point - can be used as dict key."""
    x: float
    y: float

point = Point(1, 2)
# point.x = 5  # FrozenInstanceError!
points_set = {point}  # Works because hashable

# Keyword-only arguments
@dataclass(kw_only=True, slots=True)
class Config:
    """Config with keyword-only arguments."""
    host: str
    port: int = 8000
    debug: bool = False

# config = Config("localhost", 8000)  # Error!
config = Config(host="localhost", port=8000)  # OK

# Ordering
@dataclass(order=True, slots=True)
class Version:
    """Comparable version."""
    major: int
    minor: int
    patch: int = 0

v1 = Version(1, 0, 0)
v2 = Version(1, 1, 0)
print(v1 < v2)  # True
print(sorted([v2, v1]))  # [Version(1, 0, 0), Version(1, 1, 0)]
```

### Field options
```python
from dataclasses import dataclass, field
from typing import Any

@dataclass(slots=True)
class User:
    """User with various field options."""

    # Required field
    username: str

    # Field with default factory (for mutable defaults)
    tags: list[str] = field(default_factory=list)

    # Field excluded from repr
    password_hash: str = field(repr=False)

    # Field excluded from comparison
    login_count: int = field(default=0, compare=False)

    # Field excluded from init (computed)
    display_name: str = field(init=False)

    # Metadata for custom processing
    email: str = field(metadata={"validator": "email"})

    def __post_init__(self) -> None:
        self.display_name = f"@{self.username}"
```

## Protocol (Structural Subtyping)

### Basic Protocol
```python
from typing import Protocol, runtime_checkable

# ✅ ПРАВИЛЬНО - Protocol for duck typing
class Drawable(Protocol):
    """Protocol for drawable objects."""

    def draw(self) -> None:
        """Draw the object."""
        ...

    def get_bounds(self) -> tuple[float, float, float, float]:
        """Get bounding box (x, y, width, height)."""
        ...


# No inheritance needed - just implement the methods
class Circle:
    """Circle that satisfies Drawable protocol."""

    def __init__(self, x: float, y: float, radius: float) -> None:
        self.x = x
        self.y = y
        self.radius = radius

    def draw(self) -> None:
        print(f"Drawing circle at ({self.x}, {self.y}) with r={self.radius}")

    def get_bounds(self) -> tuple[float, float, float, float]:
        return (
            self.x - self.radius,
            self.y - self.radius,
            self.radius * 2,
            self.radius * 2,
        )


def render(shape: Drawable) -> None:
    """Render any drawable shape."""
    shape.draw()
    bounds = shape.get_bounds()
    print(f"Bounds: {bounds}")


# Circle satisfies Drawable without explicit inheritance
circle = Circle(10, 20, 5)
render(circle)  # Works!
```

### runtime_checkable Protocol
```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Closeable(Protocol):
    """Protocol for closeable resources."""

    def close(self) -> None:
        ...


class FileWrapper:
    def __init__(self, path: str) -> None:
        self.file = open(path)

    def close(self) -> None:
        self.file.close()


# Runtime checking
fw = FileWrapper("test.txt")
print(isinstance(fw, Closeable))  # True

# Also works with built-in types
import io
buffer = io.StringIO()
print(isinstance(buffer, Closeable))  # True
```

### Protocol vs ABC
```python
from abc import ABC, abstractmethod
from typing import Protocol

# ABC - nominal typing (explicit inheritance required)
class AbstractRepository(ABC):
    @abstractmethod
    def save(self, entity: object) -> None:
        pass

class UserRepo(AbstractRepository):  # Must inherit!
    def save(self, entity: object) -> None:
        pass


# Protocol - structural typing (no inheritance needed)
class Repository(Protocol):
    def save(self, entity: object) -> None:
        ...

class ProductRepo:  # No inheritance!
    def save(self, entity: object) -> None:
        pass

def use_repo(repo: Repository) -> None:
    repo.save(object())

# Both work
use_repo(UserRepo())
use_repo(ProductRepo())
```

## Generic Classes (Python 3.12+)

### New syntax
```python
# ✅ ПРАВИЛЬНО - Python 3.12+ generic syntax
class Stack[T]:
    """Generic stack implementation."""

    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        """Push item onto stack."""
        self._items.append(item)

    def pop(self) -> T:
        """Pop item from stack."""
        if not self._items:
            raise IndexError("Stack is empty")
        return self._items.pop()

    def peek(self) -> T:
        """View top item without removing."""
        if not self._items:
            raise IndexError("Stack is empty")
        return self._items[-1]

    def __len__(self) -> int:
        return len(self._items)


# Type inference works
int_stack = Stack[int]()
int_stack.push(1)
int_stack.push(2)
value: int = int_stack.pop()

str_stack = Stack[str]()
str_stack.push("hello")
```

### Multiple type parameters
```python
class Pair[T, U]:
    """Generic pair of two values."""

    def __init__(self, first: T, second: U) -> None:
        self.first = first
        self.second = second

    def swap(self) -> "Pair[U, T]":
        """Return new pair with swapped values."""
        return Pair(self.second, self.first)

    def map_first[V](self, func: Callable[[T], V]) -> "Pair[V, U]":
        """Map function over first element."""
        return Pair(func(self.first), self.second)


pair = Pair("hello", 42)
swapped = pair.swap()  # Pair[int, str]
```

### Bounded type parameters
```python
from typing import SupportsFloat

# T must be comparable
class SortedList[T: SupportsLessThan]:
    """List that maintains sorted order."""

    def __init__(self) -> None:
        self._items: list[T] = []

    def add(self, item: T) -> None:
        import bisect
        bisect.insort(self._items, item)


# T must be a subclass of Entity
class Repository[T: Entity]:
    """Generic repository for entities."""

    def __init__(self) -> None:
        self._store: dict[int, T] = {}

    def save(self, entity: T) -> None:
        self._store[entity.id] = entity

    def get(self, entity_id: int) -> T | None:
        return self._store.get(entity_id)
```

## Pydantic v2 Models

### Base models
```python
from pydantic import BaseModel, Field, ConfigDict, EmailStr

# ✅ ПРАВИЛЬНО - Pydantic v2 syntax
class UserBase(BaseModel):
    """Base user fields."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_default=True,
    )

    username: str = Field(min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    """Fields for creating a user."""

    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    """Fields for updating a user (all optional)."""

    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None


class UserResponse(UserBase):
    """User response (public fields)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
```

### Validators (Pydantic v2)
```python
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Self

class User(BaseModel):
    """User with Pydantic v2 validators."""

    username: str
    email: str
    password: str
    password_confirm: str

    # Field validator
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain digit")
        return v

    # Model validator (cross-field validation)
    @model_validator(mode="after")
    def check_passwords_match(self) -> Self:
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self
```

### Computed fields
```python
from pydantic import BaseModel, computed_field

class Rectangle(BaseModel):
    """Rectangle with computed fields."""

    width: float
    height: float

    @computed_field
    @property
    def area(self) -> float:
        """Computed area field."""
        return self.width * self.height

    @computed_field
    @property
    def perimeter(self) -> float:
        """Computed perimeter field."""
        return 2 * (self.width + self.height)


rect = Rectangle(width=10, height=5)
print(rect.model_dump())
# {'width': 10, 'height': 5, 'area': 50, 'perimeter': 30}
```

## Inheritance

### Composition over inheritance
```python
# ✅ ПРАВИЛЬНО - composition
@dataclass
class Engine:
    horsepower: int

    def start(self) -> str:
        return f"Engine with {self.horsepower}hp started"


@dataclass
class Car:
    model: str
    engine: Engine  # Composition

    def start(self) -> str:
        return f"{self.model}: {self.engine.start()}"


# Flexible - can swap engines
car = Car("Tesla", Engine(400))

# ❌ AVOID - deep inheritance hierarchies
class Vehicle:
    pass

class Car(Vehicle):
    pass

class ElectricCar(Car):  # Getting too deep
    pass

class TeslaModelS(ElectricCar):  # Too specific
    pass
```

### Mixins
```python
from datetime import datetime
from typing import Any

class TimestampMixin:
    """Mixin for adding timestamp fields."""

    created_at: datetime
    updated_at: datetime

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)

    def touch(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.now()


class JSONMixin:
    """Mixin for JSON serialization."""

    def to_json(self) -> str:
        import json
        return json.dumps(self.__dict__, default=str)


@dataclass
class User(TimestampMixin, JSONMixin):
    """User with mixins."""

    username: str
    email: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
```

## Singleton Pattern

```python
from typing import Self

class Singleton:
    """Thread-safe singleton using __new__."""

    _instance: Self | None = None

    def __new__(cls) -> Self:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance


# Better: use module-level instance or dependency injection
# singletons are often an anti-pattern
```

## Чеклист

- [ ] Класс имеет единственную ответственность
- [ ] Используется `dataclass` для структур данных
- [ ] `dataclass` использует `slots=True` для оптимизации
- [ ] Используется `Protocol` для duck typing
- [ ] Generic классы используют синтаксис `[T]` (Python 3.12+)
- [ ] Методы используют `Self` для возвращаемого типа
- [ ] Нет mutable class attributes
- [ ] Pydantic модели используют v2 синтаксис
- [ ] Композиция предпочитается наследованию
- [ ] `__init__` не содержит сложной логики
- [ ] Properties используются для computed/validated attributes
