# Python Exceptions - Исключения

## Общие принципы

- **Просите прощения, а не разрешения** (EAFP - Easier to Ask for Forgiveness than Permission)
- Используйте **конкретные исключения**, не общие
- Исключения для **исключительных ситуаций**, не для управления потоком
- Всегда **документируйте** возможные исключения

## Try-Except блоки

### Базовое использование
```python
# ✅ ПРАВИЛЬНО - ловим конкретное исключение
try:
    result = int(user_input)
except ValueError:
    print("Invalid number")

# ✅ ПРАВИЛЬНО - множественные исключения
try:
    with open("file.txt") as f:
        data = json.load(f)
except FileNotFoundError:
    print("File not found")
except json.JSONDecodeError:
    print("Invalid JSON")

# ✅ ПРАВИЛЬНО - несколько исключений одновременно
try:
    process_data()
except (ValueError, TypeError) as e:
    logger.error(f"Data error: {e}")

# ❌ НЕПРАВИЛЬНО - голый except
try:
    result = risky_operation()
except:  # Ловит ВСЕ исключения, даже системные!
    pass

# ❌ НЕПРАВИЛЬНО - слишком широкий except
try:
    result = process()
except Exception:  # Слишком общее
    pass

# ✅ ПРАВИЛЬНО - если нужен широкий except, логируйте
try:
    result = process()
except Exception as e:
    logger.exception("Unexpected error")
    raise
```

### Else и finally
```python
# ✅ ПРАВИЛЬНО - else выполняется если исключений не было
try:
    file = open("data.txt")
except FileNotFoundError:
    print("File not found")
else:
    # Выполнится только если файл открыт успешно
    data = file.read()
    file.close()

# ✅ ПРАВИЛЬНО - finally всегда выполняется
try:
    connection = database.connect()
    data = connection.query()
except DatabaseError as e:
    logger.error(f"Database error: {e}")
finally:
    # Выполнится в любом случае
    if connection:
        connection.close()

# ✅ ПРАВИЛЬНО - полная структура
try:
    file = open("data.txt")
    data = process(file.read())
except FileNotFoundError:
    logger.error("File not found")
    data = None
except ProcessError as e:
    logger.error(f"Processing failed: {e}")
    data = None
else:
    logger.info("Processing successful")
finally:
    if 'file' in locals():
        file.close()
```

## Создание собственных исключений

### Базовые исключения
```python
# ✅ ПРАВИЛЬНО - наследование от соответствующего класса
class ValidationError(ValueError):
    """Raised when data validation fails."""
    pass

class DatabaseConnectionError(ConnectionError):
    """Raised when database connection fails."""
    pass

class ResourceNotFoundError(Exception):
    """Raised when requested resource not found."""
    pass

# ✅ ПРАВИЛЬНО - исключение с дополнительной информацией
class APIError(Exception):
    """Base class for API errors."""
    
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message

class NotFoundError(APIError):
    """Raised when resource is not found."""
    
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=404)
```

### Иерархия исключений
```python
# ✅ ПРАВИЛЬНО - иерархия для удобной обработки
class AppError(Exception):
    """Base exception for application."""
    pass

class ValidationError(AppError):
    """Validation related errors."""
    pass

class EmailValidationError(ValidationError):
    """Email validation failed."""
    pass

class PasswordValidationError(ValidationError):
    """Password validation failed."""
    pass

class DatabaseError(AppError):
    """Database related errors."""
    pass

# Использование - можем ловить на разных уровнях
try:
    validate_email(email)
except EmailValidationError:
    # Конкретная обработка email
    pass
except ValidationError:
    # Общая обработка валидации
    pass
except AppError:
    # Обработка любых ошибок приложения
    pass
```

## Raising исключений

### Когда бросать исключения
```python
# ✅ ПРАВИЛЬНО - валидация аргументов
def divide(a: float, b: float) -> float:
    """Divide a by b.
    
    Raises:
        ValueError: If b is zero
    """
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

# ✅ ПРАВИЛЬНО - недопустимое состояние
def withdraw(self, amount: float) -> None:
    """Withdraw money from account.
    
    Raises:
        ValueError: If amount is negative or exceeds balance
    """
    if amount < 0:
        raise ValueError("Amount cannot be negative")
    if amount > self.balance:
        raise ValueError("Insufficient funds")
    self.balance -= amount

# ✅ ПРАВИЛЬНО - не найден ресурс
def get_user(user_id: int) -> User:
    """Get user by ID.
    
    Raises:
        UserNotFoundError: If user doesn't exist
    """
    user = db.query(User).get(user_id)
    if user is None:
        raise UserNotFoundError(f"User {user_id} not found")
    return user
```

### Raise from
```python
# ✅ ПРАВИЛЬНО - сохранение исходного исключения
def load_config(filepath: str) -> dict:
    """Load configuration from file.
    
    Raises:
        ConfigError: If config cannot be loaded
    """
    try:
        with open(filepath) as f:
            return json.load(f)
    except FileNotFoundError as e:
        raise ConfigError(f"Config file not found: {filepath}") from e
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid JSON in config") from e

# ❌ НЕПРАВИЛЬНО - теряем исходное исключение
def load_config(filepath: str) -> dict:
    try:
        with open(filepath) as f:
            return json.load(f)
    except Exception:
        raise ConfigError("Failed to load config")  # Теряем причину!

# ✅ ПРАВИЛЬНО - подавление исходного исключения (редко)
try:
    attempt_operation()
except SomeError:
    raise NewError() from None  # Подавляем цепочку
```

### Re-raising исключений
```python
# ✅ ПРАВИЛЬНО - просто raise сохраняет стек
try:
    risky_operation()
except ValueError as e:
    logger.error(f"Validation error: {e}")
    raise  # Пробрасываем дальше с оригинальным стеком

# ❌ НЕПРАВИЛЬНО - raise e теряет часть стека
try:
    risky_operation()
except ValueError as e:
    logger.error(f"Validation error: {e}")
    raise e  # Теряется часть информации о стеке

# ✅ ПРАВИЛЬНО - обработка и пробрасывание
try:
    process_data()
except ProcessError:
    cleanup()
    raise  # Очистили ресурсы и пробросили дальше
```

## EAFP vs LBYL

### EAFP - Easier to Ask Forgiveness than Permission
```python
# ✅ ПРАВИЛЬНО - EAFP стиль (питонично)
try:
    value = dictionary[key]
except KeyError:
    value = default_value

try:
    with open("file.txt") as f:
        data = f.read()
except FileNotFoundError:
    data = None

# ✅ ПРАВИЛЬНО - для операций с файлами
try:
    os.remove(filepath)
except FileNotFoundError:
    pass  # Файл уже удален

# ❌ LBYL - Look Before You Leap (менее питонично)
if key in dictionary:
    value = dictionary[key]
else:
    value = default_value

if os.path.exists("file.txt"):
    with open("file.txt") as f:  # Race condition!
        data = f.read()
```

### Когда использовать LBYL
```python
# ✅ ПРАВИЛЬНО - LBYL для дорогих операций
if database.is_connected():
    result = database.query()  # Дорогая операция

# ✅ ПРАВИЛЬНО - для предотвращения побочных эффектов
if user.has_permission("delete"):
    delete_resource()  # Необратимая операция

# ✅ ПРАВИЛЬНО - для проверок перед серией операций
if all([file1.exists(), file2.exists(), file3.exists()]):
    process_files(file1, file2, file3)
```

## Context managers для исключений

### Suppress
```python
# ✅ ПРАВИЛЬНО - подавление ожидаемых исключений
from contextlib import suppress

# Удаление файла, игнорируя отсутствие
with suppress(FileNotFoundError):
    os.remove(filepath)

# Эквивалентно
try:
    os.remove(filepath)
except FileNotFoundError:
    pass

# ✅ ПРАВИЛЬНО - несколько исключений
with suppress(FileNotFoundError, PermissionError):
    os.remove(filepath)
```

### Custom exception handlers
```python
# ✅ ПРАВИЛЬНО - контекстный менеджер для обработки
from contextlib import contextmanager

@contextmanager
def handle_database_errors():
    """Handle database errors with logging."""
    try:
        yield
    except DatabaseConnectionError as e:
        logger.error(f"Connection failed: {e}")
        raise
    except DatabaseQueryError as e:
        logger.error(f"Query failed: {e}")
        raise
    finally:
        logger.info("Database operation completed")

# Использование
with handle_database_errors():
    db.query("SELECT * FROM users")
```

## Logging исключений

### Правильное логирование
```python
# ✅ ПРАВИЛЬНО - logger.exception() включает traceback
import logging

logger = logging.getLogger(__name__)

try:
    risky_operation()
except Exception as e:
    logger.exception("Operation failed")  # Автоматически добавляет traceback
    raise

# ✅ ПРАВИЛЬНО - разные уровни для разных исключений
try:
    process_data()
except ValidationError as e:
    logger.warning(f"Validation failed: {e}")
except DatabaseError as e:
    logger.error(f"Database error: {e}")
except Exception as e:
    logger.critical(f"Unexpected error: {e}")
    raise

# ❌ НЕПРАВИЛЬНО - потеря информации
try:
    risky_operation()
except Exception as e:
    logger.error(str(e))  # Теряем traceback!
```

### Structured logging
```python
# ✅ ПРАВИЛЬНО - структурированное логирование
try:
    process_user(user_id)
except UserNotFoundError as e:
    logger.error(
        "User processing failed",
        extra={
            "user_id": user_id,
            "error_type": "not_found",
            "error_message": str(e)
        }
    )
except Exception as e:
    logger.exception(
        "Unexpected error",
        extra={
            "user_id": user_id,
            "operation": "process_user"
        }
    )
```

## Exception Groups (Python 3.11+)

### Обработка множественных исключений
```python
# ✅ ПРАВИЛЬНО - ExceptionGroup для параллельных операций
async def process_all(items: list) -> None:
    """Process all items, collecting errors."""
    errors = []
    
    for item in items:
        try:
            await process(item)
        except ProcessError as e:
            errors.append(e)
    
    if errors:
        raise ExceptionGroup("Processing failed", errors)

# Обработка
try:
    await process_all(items)
except* ProcessError as eg:
    for error in eg.exceptions:
        logger.error(f"Process error: {error}")
except* ValidationError as eg:
    for error in eg.exceptions:
        logger.warning(f"Validation error: {error}")
```

## FastAPI Exception Handling

### HTTPException
```python
# ✅ ПРАВИЛЬНО - использование HTTPException
from fastapi import HTTPException, status

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    """Get user by ID."""
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# ✅ ПРАВИЛЬНО - с дополнительными заголовками
@router.post("/login")
async def login(credentials: LoginData) -> Token:
    """Login user."""
    user = authenticate(credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return create_token(user)
```

### Custom exception handlers
```python
# ✅ ПРАВИЛЬНО - глобальные обработчики исключений
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

class UserNotFoundError(Exception):
    """User not found exception."""
    
    def __init__(self, user_id: int) -> None:
        self.user_id = user_id
        super().__init__(f"User {user_id} not found")

@app.exception_handler(UserNotFoundError)
async def user_not_found_handler(
    request: Request,
    exc: UserNotFoundError
) -> JSONResponse:
    """Handle user not found errors."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "message": str(exc),
            "user_id": exc.user_id
        }
    )

@app.exception_handler(ValueError)
async def validation_handler(
    request: Request,
    exc: ValueError
) -> JSONResponse:
    """Handle validation errors."""
    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "message": str(exc)
        }
    )

# Общий обработчик для неожиданных ошибок
@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected errors."""
    logger.exception("Unexpected error")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred"
        }
    )
```

### Request validation errors
```python
# ✅ ПРАВИЛЬНО - обработка ошибок валидации Pydantic
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle request validation errors."""
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "details": exc.errors()
        }
    )
```

## Async Exception Handling

### Try-except в async функциях
```python
# ✅ ПРАВИЛЬНО - обработка в async функциях
async def fetch_user(user_id: int) -> User:
    """Fetch user asynchronously.
    
    Raises:
        UserNotFoundError: If user doesn't exist
        DatabaseError: If database error occurs
    """
    try:
        async with db.session() as session:
            result = await session.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if user is None:
                raise UserNotFoundError(f"User {user_id} not found")
            
            return user
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise DatabaseError("Failed to fetch user") from e
```

### Asyncio exception handling
```python
# ✅ ПРАВИЛЬНО - обработка в asyncio.gather
import asyncio

async def process_all(items: list) -> list:
    """Process all items concurrently."""
    tasks = [process_item(item) for item in items]
    
    # return_exceptions=True - не останавливается на первой ошибке
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Обработка ошибок
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Item {i} failed: {result}")
    
    # Вернуть только успешные
    return [r for r in results if not isinstance(r, Exception)]
```

## Best Practices

### Документирование исключений
```python
# ✅ ПРАВИЛЬНО - документируйте все исключения
def divide(a: float, b: float) -> float:
    """Divide two numbers.
    
    Args:
        a: Numerator
        b: Denominator
        
    Returns:
        Result of division
        
    Raises:
        ValueError: If b is zero
        TypeError: If arguments are not numeric
    """
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("Arguments must be numeric")
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

### Не подавляйте исключения без причины
```python
# ❌ НЕПРАВИЛЬНО - молчаливое подавление
try:
    critical_operation()
except Exception:
    pass  # Что пошло не так?

# ✅ ПРАВИЛЬНО - логируйте или обрабатывайте
try:
    critical_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}")
    fallback_operation()
```

## Чеклист исключений

- [ ] Ловятся конкретные исключения, не Exception
- [ ] Исключения документированы в docstring
- [ ] Используется EAFP где уместно
- [ ] Собственные исключения наследуют подходящий класс
- [ ] Используется raise from для цепочки исключений
- [ ] Исключения логируются с traceback
- [ ] Finally используется для cleanup
- [ ] Не используется голый except
- [ ] HTTPException для FastAPI endpoints
- [ ] Custom handlers для специфичных ошибок
