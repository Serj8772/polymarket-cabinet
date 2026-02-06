# Python Async - Асинхронное программирование

## Общие принципы

- Используйте **async/await** вместо callbacks
- **Не блокируйте** event loop синхронными операциями
- Используйте **TaskGroup** вместо gather (Python 3.11+)
- **Всегда await** корутины

## Основы async/await

### Async функции
```python
import asyncio
import httpx

# ✅ ПРАВИЛЬНО - определение async функции
async def fetch_data(url: str) -> dict:
    """Fetch data from URL asynchronously."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# ✅ ПРАВИЛЬНО - вызов async функции
async def main() -> None:
    data = await fetch_data("https://api.example.com/data")
    print(data)

# ❌ НЕПРАВИЛЬНО - забыт await
async def main() -> None:
    data = fetch_data("https://api.example.com/data")  # Корутина, не данные!
    print(data)  # <coroutine object...>
```

### Запуск async кода
```python
import asyncio

async def main() -> None:
    await do_something()

# ✅ ПРАВИЛЬНО - asyncio.run()
if __name__ == "__main__":
    asyncio.run(main())

# ❌ УСТАРЕЛО - не используйте get_event_loop()
# loop = asyncio.get_event_loop()
# loop.run_until_complete(main())
```

## TaskGroup (Python 3.11+) - рекомендуется

### Базовое использование
```python
import asyncio

# ✅ ПРАВИЛЬНО - TaskGroup вместо gather
async def fetch_all_users(user_ids: list[int]) -> list[User]:
    """Fetch multiple users concurrently with proper error handling."""
    users: list[User] = []

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_user(uid)) for uid in user_ids]

    # Все задачи завершены успешно
    users = [task.result() for task in tasks]
    return users
```

### Преимущества TaskGroup над gather

```python
import asyncio

# ❌ ПРОБЛЕМА с gather - неудобная обработка ошибок
async def with_gather() -> None:
    results = await asyncio.gather(
        task1(),
        task2(),
        task3(),
        return_exceptions=True  # Ошибки смешаны с результатами
    )
    # Нужно вручную проверять каждый результат
    for r in results:
        if isinstance(r, Exception):
            handle_error(r)

# ✅ ПРАВИЛЬНО - TaskGroup с автоматической отменой
async def with_taskgroup() -> None:
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(task1())
            tg.create_task(task2())
            tg.create_task(task3())
        # Если дошли сюда - все задачи успешны
    except* ValueError as eg:
        # Обработка ValueError из любой задачи
        for exc in eg.exceptions:
            logger.error(f"ValueError: {exc}")
    except* ConnectionError as eg:
        # Обработка ConnectionError
        for exc in eg.exceptions:
            logger.error(f"Connection error: {exc}")
```

### Паттерн: сбор результатов
```python
async def fetch_with_results[T](
    items: list[str],
    fetch_func: Callable[[str], Awaitable[T]],
) -> list[T]:
    """Fetch all items and collect results."""
    results: list[T] = []

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_func(item)) for item in items]

    return [task.result() for task in tasks]

# Использование
users = await fetch_with_results(user_ids, fetch_user)
```

## Timeout (Python 3.11+)

### asyncio.timeout
```python
import asyncio

# ✅ ПРАВИЛЬНО - context manager timeout
async def fetch_with_timeout(url: str) -> dict:
    """Fetch with timeout using context manager."""
    async with asyncio.timeout(10):  # 10 секунд
        return await fetch_data(url)

# ✅ ПРАВИЛЬНО - обработка TimeoutError
async def safe_fetch(url: str) -> dict | None:
    """Fetch with timeout and fallback."""
    try:
        async with asyncio.timeout(5):
            return await fetch_data(url)
    except TimeoutError:
        logger.warning(f"Timeout fetching {url}")
        return None

# ✅ ПРАВИЛЬНО - deadline (абсолютное время)
async def process_batch(items: list[str]) -> None:
    """Process items before deadline."""
    deadline = asyncio.get_event_loop().time() + 30  # 30 секунд от сейчас

    async with asyncio.timeout_at(deadline):
        for item in items:
            await process(item)
```

### Отложенный timeout
```python
async def cancelable_operation() -> None:
    """Operation with reschedule-able timeout."""
    async with asyncio.timeout(None) as cm:  # Без начального timeout
        # Установить timeout позже
        cm.reschedule(asyncio.get_event_loop().time() + 10)

        await long_operation()

        # Можно отменить timeout
        cm.reschedule(None)
```

## asyncio.gather (legacy)

```python
# ✅ ПРАВИЛЬНО - для простых случаев без сложной обработки ошибок
async def fetch_all(urls: list[str]) -> list[dict]:
    """Fetch all URLs concurrently."""
    return await asyncio.gather(*[fetch_data(url) for url in urls])

# С return_exceptions для сбора ошибок
async def fetch_all_safe(urls: list[str]) -> list[dict | Exception]:
    """Fetch all, collecting exceptions."""
    results = await asyncio.gather(
        *[fetch_data(url) for url in urls],
        return_exceptions=True
    )
    return results
```

## Running sync code in async context

### asyncio.to_thread (Python 3.9+)
```python
import asyncio

# ✅ ПРАВИЛЬНО - CPU-bound или blocking I/O в async контексте
async def process_file(path: str) -> str:
    """Process file without blocking event loop."""
    # Blocking file operation in thread pool
    content = await asyncio.to_thread(read_large_file, path)

    # CPU-bound processing in thread pool
    result = await asyncio.to_thread(cpu_intensive_process, content)

    return result

# ✅ ПРАВИЛЬНО - blocking library call
async def sync_db_query(query: str) -> list:
    """Run sync database query in thread."""
    return await asyncio.to_thread(sync_db.execute, query)
```

### run_in_executor (legacy)
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Для более контроля над executor
executor = ThreadPoolExecutor(max_workers=4)

async def process_with_executor(data: bytes) -> str:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, cpu_bound_func, data)
```

## Async Context Managers

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

# ✅ ПРАВИЛЬНО - async context manager
class AsyncDBConnection:
    async def __aenter__(self) -> "AsyncDBConnection":
        self.conn = await create_connection()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.conn.close()

# ✅ ПРАВИЛЬНО - с декоратором
@asynccontextmanager
async def get_db_session() -> AsyncIterator[AsyncSession]:
    """Get database session as context manager."""
    session = AsyncSession()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()

# Использование
async with get_db_session() as session:
    await session.execute(query)
```

## Async Iterators and Generators

```python
from collections.abc import AsyncIterator

# ✅ ПРАВИЛЬНО - async generator
async def stream_data(url: str) -> AsyncIterator[dict]:
    """Stream data from paginated API."""
    page = 1
    while True:
        data = await fetch_page(url, page)
        if not data:
            break
        for item in data:
            yield item
        page += 1

# Использование
async for item in stream_data("https://api.example.com"):
    await process(item)

# ✅ ПРАВИЛЬНО - async list comprehension
results = [item async for item in stream_data(url) if item.is_valid]
```

## Semaphore для ограничения concurrency

```python
import asyncio

# ✅ ПРАВИЛЬНО - ограничение количества одновременных запросов
async def fetch_all_limited(urls: list[str], max_concurrent: int = 10) -> list[dict]:
    """Fetch URLs with concurrency limit."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def fetch_with_limit(url: str) -> dict:
        async with semaphore:
            return await fetch_data(url)

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_with_limit(url)) for url in urls]

    return [task.result() for task in tasks]
```

## Cancellation

```python
import asyncio

# ✅ ПРАВИЛЬНО - обработка отмены
async def cancellable_operation() -> None:
    """Operation that handles cancellation gracefully."""
    try:
        while True:
            await process_batch()
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        # Cleanup before cancellation
        await cleanup()
        raise  # Re-raise to properly cancel

# ✅ ПРАВИЛЬНО - shielding from cancellation
async def critical_operation() -> None:
    """Operation that shouldn't be cancelled mid-way."""
    # Shield critical section from cancellation
    await asyncio.shield(save_to_database())
```

## FastAPI async patterns

### Async route handlers
```python
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Async route handler."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404)
    return user
```

### Background tasks
```python
from fastapi import BackgroundTasks

@app.post("/users")
async def create_user(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
) -> UserResponse:
    """Create user with background email."""
    user = await create_user_in_db(user_data)

    # Non-blocking background task
    background_tasks.add_task(send_welcome_email, user.email)

    return user
```

### Lifespan events
```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler."""
    # Startup
    await init_database()
    await start_background_workers()

    yield

    # Shutdown
    await stop_background_workers()
    await close_database()

app = FastAPI(lifespan=lifespan)
```

## Чеклист

- [ ] Используется `asyncio.TaskGroup` вместо `gather` (Python 3.11+)
- [ ] Используется `asyncio.timeout` вместо `wait_for` (Python 3.11+)
- [ ] Используется `asyncio.to_thread` для blocking операций
- [ ] Корректно обрабатывается `CancelledError`
- [ ] Semaphore для ограничения concurrency
- [ ] FastAPI использует `lifespan` вместо `on_startup/on_shutdown`
- [ ] Async context managers для ресурсов
- [ ] `except*` для обработки ExceptionGroup из TaskGroup
