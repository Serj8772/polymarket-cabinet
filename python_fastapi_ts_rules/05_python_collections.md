# Python Collections - Коллекции

## Общие принципы

- Выбирайте **правильный тип коллекции** для задачи
- Используйте **comprehensions** вместо циклов где возможно
- Предпочитайте **встроенные типы** специализированным
- Избегайте **изменения коллекций** во время итерации

## Выбор коллекции

| Задача | Коллекция | Причина |
|--------|-----------|---------|
| Упорядоченная последовательность | `list` | O(1) доступ по индексу |
| Уникальные элементы | `set` | O(1) проверка членства |
| Ключ-значение | `dict` | O(1) доступ по ключу |
| Неизменяемая последовательность | `tuple` | Hashable, память |
| FIFO очередь | `collections.deque` | O(1) с обоих концов |
| Подсчет элементов | `collections.Counter` | Специализирован |

## Списки (list)

### Создание
```python
# ✅ ПРАВИЛЬНО - типизированные списки
empty_list: list[int] = []
numbers: list[int] = [1, 2, 3, 4, 5]
mixed: list[int | str] = [1, "two", 3]

# List comprehension
squares = [x**2 for x in range(10)]

# От итератора
from_range = list(range(10))
```

### Операции
```python
numbers = [1, 2, 3]

# Добавление
numbers.append(4)           # [1, 2, 3, 4]
numbers.extend([5, 6])      # [1, 2, 3, 4, 5, 6]
numbers.insert(0, 0)        # [0, 1, 2, 3, 4, 5, 6]

# Объединение
list1 = [1, 2]
list2 = [3, 4]
combined = [*list1, *list2]  # [1, 2, 3, 4]

# Доступ
first = numbers[0]
last = numbers[-1]
slice_result = numbers[1:4]  # [2, 3, 4]
reversed_list = numbers[::-1]

# Удаление
numbers.remove(3)       # Удалить значение
popped = numbers.pop()  # Удалить последний
del numbers[0]          # Удалить по индексу
```

### List Comprehensions
```python
# ✅ ПРАВИЛЬНО - читаемые comprehensions
squares = [x**2 for x in range(10)]
evens = [x for x in numbers if x % 2 == 0]
pairs = [(x, y) for x in range(3) for y in range(3)]

# ✅ ПРАВИЛЬНО - с условием
active_users = [u.name for u in users if u.is_active]

# ❌ НЕПРАВИЛЬНО - слишком сложно
# Используйте обычный цикл или функцию
result = [
    transform(x)
    for x in items
    if condition1(x) and condition2(x)
    for y in x.children
    if another_condition(y)
]

# ✅ ПРАВИЛЬНО - разбить на функцию
def process_item(item: Item) -> list[Result]:
    if not condition1(item) or not condition2(item):
        return []
    return [
        transform(child)
        for child in item.children
        if another_condition(child)
    ]

results = [r for item in items for r in process_item(item)]
```

## Словари (dict)

### Создание
```python
# ✅ ПРАВИЛЬНО
empty: dict[str, int] = {}
user: dict[str, str] = {"name": "John", "email": "john@example.com"}

# Dict comprehension
squares = {x: x**2 for x in range(5)}

# Из пар
pairs = [("a", 1), ("b", 2)]
from_pairs = dict(pairs)
```

### Доступ
```python
user = {"name": "John", "age": 30}

# ✅ ПРАВИЛЬНО - безопасный доступ
email = user.get("email", "default@example.com")
name = user.get("name")  # None если нет

# ✅ ПРАВИЛЬНО - с проверкой
if "email" in user:
    send_email(user["email"])

# ❌ НЕПРАВИЛЬНО - KeyError
# email = user["email"]
```

### Слияние словарей (Python 3.9+)
```python
defaults = {"theme": "light", "lang": "en"}
user_prefs = {"theme": "dark", "font_size": 14}

# ✅ ПРАВИЛЬНО - оператор |
config = defaults | user_prefs
# {"theme": "dark", "lang": "en", "font_size": 14}

# ✅ ПРАВИЛЬНО - update in-place
defaults |= user_prefs

# Старый способ (тоже работает)
config = {**defaults, **user_prefs}
```

### Итерация
```python
user = {"name": "John", "age": 30}

# Ключи и значения
for key, value in user.items():
    print(f"{key}: {value}")

# Только ключи
for key in user:
    print(key)

# Только значения
for value in user.values():
    print(value)

# ❌ НЕПРАВИЛЬНО - изменение во время итерации
for key in user:
    del user[key]  # RuntimeError!

# ✅ ПРАВИЛЬНО - новый словарь
user = {k: v for k, v in user.items() if k != "age"}

# ✅ ПРАВИЛЬНО - копия ключей
for key in list(user.keys()):
    if should_delete(key):
        del user[key]
```

## Множества (set)

### Операции
```python
set1 = {1, 2, 3, 4}
set2 = {3, 4, 5, 6}

# Объединение
union = set1 | set2            # {1, 2, 3, 4, 5, 6}

# Пересечение
intersection = set1 & set2     # {3, 4}

# Разность
difference = set1 - set2       # {1, 2}

# Симметричная разность
sym_diff = set1 ^ set2         # {1, 2, 5, 6}

# Проверки
is_subset = {1, 2} <= set1     # True
is_superset = set1 >= {1, 2}   # True
```

### Использование
```python
# Удаление дубликатов (порядок не сохраняется)
numbers = [1, 2, 2, 3, 3, 3]
unique = list(set(numbers))

# Сохранение порядка (Python 3.7+)
unique_ordered = list(dict.fromkeys(numbers))

# Быстрая проверка членства O(1)
valid_codes = {"admin", "user", "guest"}
if user_code in valid_codes:
    grant_access()

# Отслеживание посещённых
seen: set[int] = set()
for item in items:
    if item.id not in seen:
        process(item)
        seen.add(item.id)
```

## Кортежи (tuple)

### Использование
```python
# Именованные кортежи лучше для структур
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

point = Point(1.0, 2.0)
print(point.x, point.y)

# Обычные tuple для возврата нескольких значений
def get_bounds() -> tuple[int, int]:
    return min_val, max_val

low, high = get_bounds()

# Распаковка
first, *rest, last = [1, 2, 3, 4, 5]
# first=1, rest=[2, 3, 4], last=5
```

## Pattern Matching с коллекциями (Python 3.10+)

### Match со списками
```python
def process_command(command: list[str]) -> str:
    match command:
        case []:
            return "Empty command"
        case [cmd]:
            return f"Single command: {cmd}"
        case ["quit" | "exit"]:
            return "Goodbye!"
        case ["help", topic]:
            return f"Help for: {topic}"
        case ["move", x, y]:
            return f"Moving to ({x}, {y})"
        case ["move", *coords] if len(coords) == 3:
            return f"Moving to 3D: {coords}"
        case [cmd, *args]:
            return f"Command {cmd} with args: {args}"
        case _:
            return "Unknown command"
```

### Match со словарями
```python
def process_event(event: dict[str, object]) -> str:
    match event:
        case {"type": "click", "x": x, "y": y}:
            return f"Click at ({x}, {y})"
        case {"type": "keypress", "key": key}:
            return f"Key pressed: {key}"
        case {"type": "scroll", "direction": "up" | "down" as dir}:
            return f"Scrolling {dir}"
        case {"error": error_msg}:
            return f"Error: {error_msg}"
        case _:
            return "Unknown event"


# Использование
process_event({"type": "click", "x": 100, "y": 200})
process_event({"type": "keypress", "key": "Enter"})
```

### Match с вложенными структурами
```python
def process_response(data: dict) -> str:
    match data:
        case {"status": "ok", "data": {"users": [first, *rest]}}:
            return f"First user: {first}, {len(rest)} more"
        case {"status": "ok", "data": {"count": count}}:
            return f"Count: {count}"
        case {"status": "error", "message": msg}:
            return f"Error: {msg}"
        case _:
            return "Unknown response"
```

## collections модуль

### defaultdict
```python
from collections import defaultdict

# Группировка по ключу
groups: defaultdict[str, list[int]] = defaultdict(list)
for item in items:
    groups[item.category].append(item.id)

# Подсчёт
counts: defaultdict[str, int] = defaultdict(int)
for word in words:
    counts[word] += 1
```

### Counter
```python
from collections import Counter

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
counter = Counter(words)

# Самые частые
print(counter.most_common(2))  # [('apple', 3), ('banana', 2)]

# Операции
counter1 = Counter(a=3, b=1)
counter2 = Counter(a=1, b=2)
print(counter1 + counter2)  # Counter({'a': 4, 'b': 3})
```

### deque
```python
from collections import deque

# FIFO очередь
queue: deque[str] = deque()
queue.append("first")
queue.append("second")
item = queue.popleft()  # "first"

# Ограниченный размер (sliding window)
recent: deque[int] = deque(maxlen=5)
for i in range(10):
    recent.append(i)
print(list(recent))  # [5, 6, 7, 8, 9]
```

## Itertools

```python
from itertools import chain, groupby, islice, zip_longest

# Объединение итераторов
combined = chain([1, 2], [3, 4], [5, 6])

# Группировка
data = [("a", 1), ("a", 2), ("b", 3)]
for key, group in groupby(sorted(data), key=lambda x: x[0]):
    print(key, list(group))

# Срез итератора
first_10 = list(islice(range(1000), 10))

# zip с заполнением
list(zip_longest([1, 2], [1, 2, 3], fillvalue=0))
# [(1, 1), (2, 2), (0, 3)]
```

## Производительность

| Операция | list | dict | set |
|----------|------|------|-----|
| Доступ по индексу | O(1) | - | - |
| Доступ по ключу | - | O(1) | O(1) |
| Поиск (in) | O(n) | O(1) | O(1) |
| Вставка в конец | O(1)* | O(1)* | O(1)* |
| Вставка в начало | O(n) | - | - |
| Удаление | O(n) | O(1) | O(1) |

\* амортизированное время

## Чеклист

- [ ] Выбран правильный тип коллекции для задачи
- [ ] Используются comprehensions вместо циклов
- [ ] Не изменяется коллекция во время итерации
- [ ] Используется `get()` для безопасного доступа к dict
- [ ] Используется `set` для быстрой проверки членства
- [ ] Pattern matching используется для сложных структур
- [ ] `defaultdict` для группировки, `Counter` для подсчёта
