# Python Flow Control - Управление потоком

## Общие принципы

- Используйте **ранний return** для упрощения логики
- Избегайте **глубокой вложенности** (максимум 3-4 уровня)
- Предпочитайте **положительные условия** отрицательным
- Используйте **guard clauses** для валидации

## Условные операторы

### If-elif-else
```python
# ✅ ПРАВИЛЬНО - четкая структура
def get_discount(total: float) -> float:
    """Calculate discount based on total."""
    if total >= 1000:
        return 0.2
    elif total >= 500:
        return 0.1
    elif total >= 100:
        return 0.05
    else:
        return 0.0

# ❌ НЕПРАВИЛЬНО - множественные if вместо elif
def get_discount(total: float) -> float:
    if total >= 1000:
        return 0.2
    if total >= 500:  # Не выполнится если total >= 1000
        return 0.1
    if total >= 100:
        return 0.05
    return 0.0
```

### Ранний return (Guard Clauses)
```python
# ✅ ПРАВИЛЬНО - ранний return для проверок
def process_user(user: User | None) -> dict:
    """Process user data."""
    if user is None:
        return {"error": "User not found"}
    
    if not user.is_active:
        return {"error": "User is inactive"}
    
    if not user.has_permission("read"):
        return {"error": "Permission denied"}
    
    # Основная логика без вложенности
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }

# ❌ НЕПРАВИЛЬНО - глубокая вложенность
def process_user(user: User | None) -> dict:
    if user is not None:
        if user.is_active:
            if user.has_permission("read"):
                return {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email
                }
            else:
                return {"error": "Permission denied"}
        else:
            return {"error": "User is inactive"}
    else:
        return {"error": "User not found"}
```

### Тернарный оператор
```python
# ✅ ПРАВИЛЬНО - для простых условий
status = "active" if user.is_active else "inactive"
max_value = a if a > b else b
greeting = f"Hello, {name}!" if name else "Hello, Guest!"

# ✅ ПРАВИЛЬНО - для простого присваивания
result = value if condition else default

# ❌ НЕПРАВИЛЬНО - сложная логика в тернарном операторе
result = (
    process_a(x) if x > 0 else process_b(x) if x < 0 else process_c(x)
)

# ✅ ПРАВИЛЬНО - используйте обычный if-elif-else
if x > 0:
    result = process_a(x)
elif x < 0:
    result = process_b(x)
else:
    result = process_c(x)
```

### Walrus оператор := (Python 3.8+)
```python
# ✅ ПРАВИЛЬНО - присваивание в условии
if (match := pattern.search(text)) is not None:
    print(match.group())

# ✅ ПРАВИЛЬНО - в list comprehension
filtered = [y for x in data if (y := transform(x)) is not None]

# ✅ ПРАВИЛЬНО - в while цикле
while (line := file.readline()) != "":
    process(line)

# ❌ НЕПРАВИЛЬНО - чрезмерное использование
if (x := get_x()) and (y := get_y()) and (z := calculate(x, y)):
    result = process(x, y, z)
```

## Циклы

### For циклы
```python
# ✅ ПРАВИЛЬНО - итерация по последовательности
for item in items:
    process(item)

# ✅ ПРАВИЛЬНО - с индексом
for index, item in enumerate(items):
    print(f"{index}: {item}")

# ✅ ПРАВИЛЬНО - с начальным индексом
for index, item in enumerate(items, start=1):
    print(f"Item {index}: {item}")

# ✅ ПРАВИЛЬНО - итерация по словарю
for key, value in user.items():
    print(f"{key}: {value}")

# ✅ ПРАВИЛЬНО - итерация по нескольким последовательностям
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
for name, age in zip(names, ages):
    print(f"{name} is {age} years old")

# ❌ НЕПРАВИЛЬНО - итерация по индексам
for i in range(len(items)):
    process(items[i])

# ✅ ПРАВИЛЬНО
for item in items:
    process(item)
```

### While циклы
```python
# ✅ ПРАВИЛЬНО - цикл с условием
count = 0
while count < 10:
    process(count)
    count += 1

# ✅ ПРАВИЛЬНО - бесконечный цикл с выходом
while True:
    data = fetch_data()
    if data is None:
        break
    process(data)

# ✅ ПРАВИЛЬНО - с walrus оператором
while (line := file.readline()) != "":
    process(line)

# ❌ НЕПРАВИЛЬНО - использование while вместо for
i = 0
while i < len(items):
    process(items[i])
    i += 1

# ✅ ПРАВИЛЬНО
for item in items:
    process(item)
```

### Break и continue
```python
# ✅ ПРАВИЛЬНО - break для раннего выхода
for item in items:
    if item.is_invalid():
        break
    process(item)

# ✅ ПРАВИЛЬНО - continue для пропуска
for item in items:
    if item.should_skip():
        continue
    process(item)

# ✅ ПРАВИЛЬНО - else в циклах
for item in items:
    if item.matches(criteria):
        result = item
        break
else:
    # Выполнится если break не сработал
    result = None

# ❌ НЕПРАВИЛЬНО - флаги вместо break
found = False
for item in items:
    if item.matches(criteria):
        result = item
        found = True
    if not found:
        process(item)
```

### Вложенные циклы
```python
# ✅ ПРАВИЛЬНО - простая вложенность
for i in range(3):
    for j in range(3):
        matrix[i][j] = i * j

# ✅ ПРАВИЛЬНО - выход из вложенных циклов с функцией
def find_in_matrix(matrix: list[list[int]], target: int) -> tuple[int, int] | None:
    """Find target in matrix."""
    for i, row in enumerate(matrix):
        for j, value in enumerate(row):
            if value == target:
                return (i, j)
    return None

# ❌ НЕПРАВИЛЬНО - глубокая вложенность
for a in range(10):
    for b in range(10):
        for c in range(10):
            for d in range(10):  # Слишком глубоко!
                process(a, b, c, d)

# ✅ ПРАВИЛЬНО - использование itertools
from itertools import product

for a, b, c, d in product(range(10), repeat=4):
    process(a, b, c, d)
```

## Match-Case (Python 3.10+)

### Базовое использование
```python
# ✅ ПРАВИЛЬНО - structural pattern matching
def handle_command(command: str) -> str:
    """Handle different commands."""
    match command.split():
        case ["quit"]:
            return "Goodbye!"
        case ["help"]:
            return "Available commands: quit, help, echo, add"
        case ["echo", *words]:
            return " ".join(words)
        case ["add", x, y]:
            return str(int(x) + int(y))
        case _:
            return "Unknown command"
```

### Pattern matching с типами
```python
# ✅ ПРАВИЛЬНО - matching по типам
def process_value(value: int | str | list) -> str:
    """Process different value types."""
    match value:
        case int(x) if x > 0:
            return f"Positive integer: {x}"
        case int(x) if x < 0:
            return f"Negative integer: {x}"
        case int():
            return "Zero"
        case str(s):
            return f"String: {s}"
        case []:
            return "Empty list"
        case [x]:
            return f"Single item: {x}"
        case [x, y]:
            return f"Two items: {x}, {y}"
        case [*items]:
            return f"Multiple items: {len(items)}"
        case _:
            return "Unknown type"
```

### Pattern matching с классами
```python
# ✅ ПРАВИЛЬНО - matching объектов
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

def describe_point(point: Point) -> str:
    """Describe point location."""
    match point:
        case Point(x=0, y=0):
            return "Origin"
        case Point(x=0, y=y):
            return f"Y-axis at {y}"
        case Point(x=x, y=0):
            return f"X-axis at {x}"
        case Point(x=x, y=y) if x == y:
            return f"Diagonal at {x}"
        case Point(x=x, y=y):
            return f"Point at ({x}, {y})"
```

## Comprehensions

### List Comprehensions
```python
# ✅ ПРАВИЛЬНО - простые comprehensions
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
upper = [word.upper() for word in words]

# ✅ ПРАВИЛЬНО - с условным выражением
transformed = [x * 2 if x > 0 else x for x in numbers]

# ❌ НЕПРАВИЛЬНО - слишком сложный
result = [
    complex_transform(x, y, z)
    for x in range(100)
    if x % 2 == 0
    for y in range(x)
    if y % 3 == 0
    for z in process(x, y)
    if z is not None
]

# ✅ ПРАВИЛЬНО - разбить на части
filtered_x = [x for x in range(100) if x % 2 == 0]
result = []
for x in filtered_x:
    for y in range(x):
        if y % 3 == 0:
            for z in process(x, y):
                if z is not None:
                    result.append(complex_transform(x, y, z))
```

### Dict и Set Comprehensions
```python
# ✅ ПРАВИЛЬНО - dict comprehension
squares_dict = {x: x**2 for x in range(10)}
inverted = {v: k for k, v in original.items()}

# ✅ ПРАВИЛЬНО - set comprehension
unique_lengths = {len(word) for word in words}
```

### Generator Expressions
```python
# ✅ ПРАВИЛЬНО - для больших данных
total = sum(x**2 for x in range(1000000))  # Не создает список в памяти

# ✅ ПРАВИЛЬНО - ленивая обработка
large_numbers = (x for x in range(1000000) if x > 100000)
for num in large_numbers:
    if process(num):
        break  # Не обработает все миллион чисел

# ❌ НЕПРАВИЛЬНО - list для больших данных
large_numbers = [x for x in range(1000000) if x > 100000]
```

## Context Managers

### With statement
```python
# ✅ ПРАВИЛЬНО - автоматическое управление ресурсами
with open("file.txt", "r") as f:
    content = f.read()

# ✅ ПРАВИЛЬНО - множественные контекстные менеджеры
with open("input.txt") as infile, open("output.txt", "w") as outfile:
    for line in infile:
        outfile.write(line.upper())

# ✅ ПРАВИЛЬНО - вложенные контексты (Python 3.10+)
with (
    open("input.txt") as infile,
    open("output.txt", "w") as outfile,
    database.connection() as conn
):
    process(infile, outfile, conn)

# ❌ НЕПРАВИЛЬНО - забытое закрытие
f = open("file.txt")
content = f.read()
f.close()  # Может не выполниться при исключении!
```

### Собственные context managers
```python
# ✅ ПРАВИЛЬНО - класс как context manager
class Timer:
    """Context manager for timing code execution."""
    
    def __enter__(self):
        self.start = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = time.time()
        self.duration = self.end - self.start
        print(f"Elapsed: {self.duration:.2f}s")
        return False

# Использование
with Timer() as timer:
    process_data()

# ✅ ПРАВИЛЬНО - функция с contextlib
from contextlib import contextmanager

@contextmanager
def timer():
    """Timer context manager."""
    start = time.time()
    try:
        yield
    finally:
        end = time.time()
        print(f"Elapsed: {end - start:.2f}s")

# Использование
with timer():
    process_data()
```

## Итераторы и генераторы

### Функции-генераторы
```python
# ✅ ПРАВИЛЬНО - генератор для больших данных
def read_large_file(filepath: str):
    """Read file line by line."""
    with open(filepath) as f:
        for line in f:
            yield line.strip()

# ✅ ПРАВИЛЬНО - генератор с состоянием
def fibonacci(n: int):
    """Generate first n Fibonacci numbers."""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

# Использование
for num in fibonacci(10):
    print(num)
```

### Itertools
```python
# ✅ ПРАВИЛЬНО - эффективные итераторы
from itertools import (
    chain, combinations, cycle, dropwhile,
    filterfalse, groupby, islice, product
)

# Объединение последовательностей
combined = chain([1, 2], [3, 4], [5, 6])

# Комбинации
pairs = combinations(["a", "b", "c"], 2)

# Бесконечный цикл
counter = cycle([1, 2, 3])  # 1, 2, 3, 1, 2, 3, ...

# Декартово произведение
coords = product(range(3), range(3))

# Группировка
data = [{"cat": "A", "val": 1}, {"cat": "A", "val": 2}]
for key, group in groupby(data, key=lambda x: x["cat"]):
    print(key, list(group))
```

## Обработка исключений в потоке

### Try-except в циклах
```python
# ✅ ПРАВИЛЬНО - обработка внутри цикла
for item in items:
    try:
        result = process(item)
        results.append(result)
    except ProcessError as e:
        logger.error(f"Failed to process {item}: {e}")
        continue

# ✅ ПРАВИЛЬНО - обработка вне цикла
try:
    for item in items:
        result = process(item)
        results.append(result)
except CriticalError as e:
    logger.critical(f"Critical error: {e}")
    raise
```

## FastAPI специфика

### Route handlers с условиями
```python
# ✅ ПРАВИЛЬНО - ранние проверки в route handlers
from fastapi import HTTPException, status

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> User:
    """Get user by ID."""
    # Ранние проверки
    if user_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    # Получение данных
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Проверка прав
    if user.id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return user
```

## Чеклист управления потоком

- [ ] Используется ранний return для проверок
- [ ] Избегается глубокая вложенность (макс 3-4 уровня)
- [ ] Положительные условия вместо отрицательных
- [ ] For вместо while где возможно
- [ ] Итерация по объектам, а не по индексам
- [ ] Comprehensions для простых случаев
- [ ] Generator expressions для больших данных
- [ ] Context managers для управления ресурсами
- [ ] Match-case для сложных паттернов (Python 3.10+)
- [ ] Избегаются флаги, используется break/continue
