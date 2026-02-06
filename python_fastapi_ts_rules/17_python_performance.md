# Python Performance - Производительность

## Общие принципы

- **Измеряйте** перед оптимизацией (профилирование)
- **Оптимизируйте узкие места**, а не весь код
- **Читаемость > Производительность** (до узких мест)
- **Используйте правильные структуры данных**

## Profiling

### cProfile
```python
# ✅ ПРАВИЛЬНО - профилирование кода
import cProfile
import pstats
from pstats import SortKey

def profile_function():
    """Profile function execution."""
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Код для профилирования
    result = expensive_operation()
    
    profiler.disable()
    
    # Статистика
    stats = pstats.Stats(profiler)
    stats.sort_stats(SortKey.CUMULATIVE)
    stats.print_stats(20)  # Топ 20 функций
    
    return result

# Декоратор для профилирования
import functools

def profile(func):
    """Decorator to profile function."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        result = func(*args, **kwargs)
        profiler.disable()
        
        stats = pstats.Stats(profiler)
        stats.sort_stats(SortKey.TIME)
        stats.print_stats(10)
        
        return result
    return wrapper

@profile
def slow_function():
    """Function to profile."""
    # Код
    pass
```

### line_profiler
```python
# ✅ ПРАВИЛЬНО - построчное профилирование
from line_profiler import LineProfiler

def profile_line_by_line():
    """Profile function line by line."""
    profiler = LineProfiler()
    profiler.add_function(expensive_function)
    profiler.enable()
    
    expensive_function()
    
    profiler.disable()
    profiler.print_stats()

# Использование через декоратор
@profile  # Требует kernprof -l -v script.py
def expensive_function():
    """Function with line-by-line profiling."""
    data = [i ** 2 for i in range(10000)]
    result = sum(data)
    return result
```

### memory_profiler
```python
# ✅ ПРАВИЛЬНО - профилирование памяти
from memory_profiler import profile

@profile
def memory_intensive_function():
    """Function that uses a lot of memory."""
    # Создание большого списка
    data = [i for i in range(1000000)]
    
    # Обработка
    result = sum(data)
    
    return result

# Запуск: python -m memory_profiler script.py
```

## Data Structures

### Правильный выбор структуры
```python
# ✅ ПРАВИЛЬНО - используйте правильную структуру

# list - для последовательности с индексацией
items = [1, 2, 3, 4, 5]
first = items[0]  # O(1)

# set - для проверки членства
valid_ids = {1, 2, 3, 4, 5}
if user_id in valid_ids:  # O(1)
    pass

# dict - для поиска по ключу
user_data = {"name": "John", "age": 30}
name = user_data["name"]  # O(1)

# deque - для очереди
from collections import deque
queue = deque([1, 2, 3])
queue.appendleft(0)  # O(1)
queue.pop()  # O(1)

# ❌ НЕПРАВИЛЬНО - неэффективные структуры
valid_ids = [1, 2, 3, 4, 5]  # list
if user_id in valid_ids:  # O(n) вместо O(1)!
    pass
```

### Comprehensions vs loops
```python
# ✅ ПРАВИЛЬНО - list comprehensions быстрее
import timeit

# List comprehension (быстрее)
def with_comprehension():
    return [i ** 2 for i in range(1000)]

# Обычный loop (медленнее)
def with_loop():
    result = []
    for i in range(1000):
        result.append(i ** 2)
    return result

# Замер
print(timeit.timeit(with_comprehension, number=10000))  # ~0.5s
print(timeit.timeit(with_loop, number=10000))  # ~0.7s
```

## Generator Optimization

### Generators для больших данных
```python
# ✅ ПРАВИЛЬНО - генератор для больших данных
def read_large_file(filepath: str):
    """Read large file line by line."""
    with open(filepath) as f:
        for line in f:
            yield line.strip()

# Использование
for line in read_large_file("large.txt"):
    process(line)  # Не загружает весь файл в память

# ❌ НЕПРАВИЛЬНО - загрузка всего файла
def read_large_file_bad(filepath: str) -> list[str]:
    with open(filepath) as f:
        return [line.strip() for line in f]  # Весь файл в памяти!

# ✅ ПРАВИЛЬНО - generator expressions
sum_squares = sum(x**2 for x in range(1000000))  # Не создает список

# ❌ НЕПРАВИЛЬНО - list comprehension для суммы
sum_squares = sum([x**2 for x in range(1000000)])  # Создает список!
```

## String Operations

### String concatenation
```python
# ✅ ПРАВИЛЬНО - join для множества строк
parts = ["hello", "world", "foo", "bar"]
result = " ".join(parts)

# ✅ ПРАВИЛЬНО - f-strings
name = "John"
age = 30
message = f"Hello, {name}! You are {age} years old."

# ❌ НЕПРАВИЛЬНО - конкатенация в цикле
result = ""
for part in parts:
    result += part + " "  # Создает новую строку каждый раз!

# Замер
import timeit

def with_join():
    return " ".join([str(i) for i in range(1000)])

def with_concat():
    result = ""
    for i in range(1000):
        result += str(i) + " "
    return result

print(timeit.timeit(with_join, number=10000))  # ~0.3s
print(timeit.timeit(with_concat, number=10000))  # ~1.2s
```

## Function Call Overhead

### Минимизация вызовов
```python
# ✅ ПРАВИЛЬНО - минимизируйте вызовы функций в циклах
# Вынесите вызов функции за цикл
upper = str.upper
result = [upper(s) for s in strings]

# ❌ НЕПРАВИЛЬНО - вызов метода в каждой итерации
result = [s.upper() for s in strings]

# ✅ ПРАВИЛЬНО - локальная переменная
def process_items(items):
    """Process items efficiently."""
    append = result.append  # Локальная ссылка
    result = []
    
    for item in items:
        append(item.process())
    
    return result
```

## Caching

### functools.lru_cache
```python
# ✅ ПРАВИЛЬНО - кэширование дорогих вычислений
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    """Calculate Fibonacci with caching."""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Без кэша: O(2^n), с кэшем: O(n)
print(fibonacci(100))  # Мгновенно с кэшем

# ✅ ПРАВИЛЬНО - кэширование с TTL
from functools import wraps
import time

def timed_lru_cache(seconds: int, maxsize: int = 128):
    """LRU cache with time expiration."""
    def wrapper(func):
        cache = lru_cache(maxsize=maxsize)(func)
        cache.lifetime = seconds
        cache.expiration = time.time() + seconds
        
        @wraps(func)
        def inner(*args, **kwargs):
            if time.time() >= cache.expiration:
                cache.cache_clear()
                cache.expiration = time.time() + cache.lifetime
            return cache(*args, **kwargs)
        
        return inner
    return wrapper

@timed_lru_cache(seconds=300, maxsize=100)
def expensive_api_call(url: str) -> dict:
    """Cached API call (5 min TTL)."""
    return requests.get(url).json()
```

### Redis caching
```python
# ✅ ПРАВИЛЬНО - кэширование в Redis
import redis
import json
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def redis_cache(expire: int = 3600):
    """Redis cache decorator."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Создание ключа
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            
            # Проверка кэша
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Вызов функции
            result = await func(*args, **kwargs)
            
            # Сохранение в кэш
            redis_client.setex(
                cache_key,
                expire,
                json.dumps(result)
            )
            
            return result
        return wrapper
    return decorator

@redis_cache(expire=600)
async def get_user_stats(user_id: int) -> dict:
    """Get user statistics (cached 10 min)."""
    # Дорогое вычисление
    return calculate_stats(user_id)
```

## Database Optimization

### Batch operations
```python
# ✅ ПРАВИЛЬНО - batch операции
from sqlalchemy import insert

async def bulk_insert_users(db: AsyncSession, users: list[dict]):
    """Bulk insert users efficiently."""
    # Один запрос вместо N
    await db.execute(insert(User), users)
    await db.commit()

# ❌ НЕПРАВИЛЬНО - N запросов
async def insert_users_slow(db: AsyncSession, users: list[dict]):
    for user_data in users:
        user = User(**user_data)
        db.add(user)
        await db.commit()  # Коммит на каждого пользователя!
```

### Query optimization
```python
# ✅ ПРАВИЛЬНО - eager loading
from sqlalchemy.orm import selectinload

async def get_users_with_posts(db: AsyncSession):
    """Get users with posts (1 query for users, 1 for posts)."""
    result = await db.execute(
        select(User).options(selectinload(User.posts))
    )
    return result.scalars().all()

# ❌ НЕПРАВИЛЬНО - N+1 проблема
async def get_users_with_posts_slow(db: AsyncSession):
    """N+1 queries problem."""
    users = await db.execute(select(User))
    users = users.scalars().all()
    
    for user in users:
        # Отдельный запрос для каждого пользователя!
        posts = await db.execute(
            select(Post).where(Post.author_id == user.id)
        )
        user.posts = posts.scalars().all()
    
    return users
```

### Indexes
```python
# ✅ ПРАВИЛЬНО - индексы на часто используемых полях
from sqlalchemy import Index

class User(Base):
    """User with indexes."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    username: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(index=True)
    
    # Композитный индекс
    __table_args__ = (
        Index("idx_email_active", "email", "is_active"),
    )
```

## Async Performance

### Concurrent execution
```python
# ✅ ПРАВИЛЬНО - параллельное выполнение
import asyncio

async def fetch_all_data():
    """Fetch data from multiple sources concurrently."""
    # Параллельное выполнение
    users, posts, comments = await asyncio.gather(
        fetch_users(),
        fetch_posts(),
        fetch_comments()
    )
    
    return users, posts, comments

# ❌ НЕПРАВИЛЬНО - последовательное выполнение
async def fetch_all_data_slow():
    """Fetch data sequentially (slow)."""
    users = await fetch_users()      # Ждем
    posts = await fetch_posts()      # Ждем
    comments = await fetch_comments() # Ждем
    
    return users, posts, comments
```

### Connection pooling
```python
# ✅ ПРАВИЛЬНО - переиспользование соединений
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,        # Размер пула
    max_overflow=10,     # Дополнительные соединения
    pool_pre_ping=True,  # Проверка соединений
    pool_recycle=3600    # Переиспользование через час
)
```

## FastAPI Performance

### Response caching
```python
# ✅ ПРАВИЛЬНО - кэширование ответов
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@app.on_event("startup")
async def startup():
    """Initialize cache on startup."""
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

@router.get("/users")
@cache(expire=60)  # Кэш на 1 минуту
async def list_users(db: AsyncSession = Depends(get_db)):
    """List users with caching."""
    users = await user_crud.get_multi(db)
    return users
```

### Background tasks
```python
# ✅ ПРАВИЛЬНО - тяжелые операции в фоне
from fastapi import BackgroundTasks

@router.post("/process")
async def process_data(
    data: ProcessData,
    background_tasks: BackgroundTasks
):
    """Process data in background."""
    # Быстрый ответ клиенту
    task_id = create_task_id()
    
    # Тяжелая обработка в фоне
    background_tasks.add_task(
        heavy_processing,
        data,
        task_id
    )
    
    return {"task_id": task_id, "status": "processing"}
```

### Compression
```python
# ✅ ПРАВИЛЬНО - сжатие ответов
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Ответы > 1KB будут сжиматься
```

## Concurrent.futures

### ThreadPoolExecutor
```python
# ✅ ПРАВИЛЬНО - I/O bound задачи в потоках
from concurrent.futures import ThreadPoolExecutor
import asyncio

async def process_files(filepaths: list[str]):
    """Process files in thread pool."""
    loop = asyncio.get_event_loop()
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        tasks = [
            loop.run_in_executor(executor, process_file, filepath)
            for filepath in filepaths
        ]
        results = await asyncio.gather(*tasks)
    
    return results

def process_file(filepath: str) -> dict:
    """Process single file (blocking I/O)."""
    with open(filepath) as f:
        data = f.read()
    return parse_data(data)
```

### ProcessPoolExecutor
```python
# ✅ ПРАВИЛЬНО - CPU bound задачи в процессах
from concurrent.futures import ProcessPoolExecutor

async def compute_heavy_tasks(data: list):
    """Compute CPU-intensive tasks in processes."""
    loop = asyncio.get_event_loop()
    
    with ProcessPoolExecutor(max_workers=4) as executor:
        tasks = [
            loop.run_in_executor(executor, cpu_intensive_task, item)
            for item in data
        ]
        results = await asyncio.gather(*tasks)
    
    return results

def cpu_intensive_task(data):
    """CPU-intensive computation."""
    # Тяжелые вычисления
    return complex_calculation(data)
```

## Memory Optimization

### Slots
```python
# ✅ ПРАВИЛЬНО - используйте __slots__ для экономии памяти
class Point:
    """Point with slots (less memory)."""
    
    __slots__ = ('x', 'y')
    
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

# Экономия памяти для большого количества объектов
points = [Point(i, i) for i in range(1000000)]

# ❌ НЕПРАВИЛЬНО - без slots (больше памяти)
class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
```

### Generator chains
```python
# ✅ ПРАВИЛЬНО - цепочки генераторов
def process_large_dataset(filepath: str):
    """Process large dataset efficiently."""
    # Каждый этап - генератор, не создает промежуточных списков
    lines = read_lines(filepath)
    cleaned = (clean_line(line) for line in lines)
    parsed = (parse_line(line) for line in cleaned)
    filtered = (item for item in parsed if is_valid(item))
    
    return filtered

# Использование
for item in process_large_dataset("data.txt"):
    save(item)
```

## Benchmark Tools

### timeit
```python
# ✅ ПРАВИЛЬНО - замер производительности
import timeit

# Простой замер
time_taken = timeit.timeit(
    "sum([i**2 for i in range(100)])",
    number=10000
)
print(f"Time: {time_taken:.4f}s")

# С setup
time_taken = timeit.timeit(
    stmt="result = process(data)",
    setup="data = list(range(1000))",
    number=1000
)

# Сравнение методов
def compare_methods():
    """Compare performance of different methods."""
    list_comp = timeit.timeit(
        "[i**2 for i in range(1000)]",
        number=10000
    )
    
    map_func = timeit.timeit(
        "list(map(lambda x: x**2, range(1000)))",
        number=10000
    )
    
    print(f"List comprehension: {list_comp:.4f}s")
    print(f"Map function: {map_func:.4f}s")
```

## Чеклист производительности

- [ ] Профилирование перед оптимизацией
- [ ] Правильные структуры данных (set для поиска, deque для очереди)
- [ ] List comprehensions вместо циклов
- [ ] Generators для больших данных
- [ ] join() для конкатенации строк
- [ ] lru_cache для дорогих вычислений
- [ ] Redis для распределенного кэша
- [ ] Batch операции для БД
- [ ] Eager loading для избежания N+1
- [ ] Индексы на часто используемых полях
- [ ] asyncio.gather для параллельного выполнения
- [ ] Connection pooling для БД
- [ ] Background tasks для тяжелых операций
- [ ] Compression для больших ответов
- [ ] __slots__ для множества экземпляров
