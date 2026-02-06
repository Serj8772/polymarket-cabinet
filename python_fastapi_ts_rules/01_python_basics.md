# Python Basics - Основы форматирования и синтаксиса

## Общие принципы

- **PEP 8** - основа стиля кода Python
- **Консистентность** - единообразие важнее личных предпочтений
- **Читаемость** - код читают чаще, чем пишут
- **Автоматизация** - используйте инструменты для форматирования

## Форматирование

### Отступы
```python
# ✅ ПРАВИЛЬНО - 4 пробела
def some_method():
    do_something()

# ❌ НЕПРАВИЛЬНО - 2 пробела или табы
def some_method():
  do_something()
```

### Максимальная длина строки
- **88 символов** - рекомендуемый максимум (Ruff/Black)
- **72 символа** - для docstrings и комментариев
- Настройте редактор для визуализации границы

### Окончания строк
- Используйте Unix-style (LF)
- Настройте Git: `git config core.autocrlf input`
- Каждый файл должен заканчиваться новой строкой

### Пробелы в конце строк
```python
# ❌ НЕПРАВИЛЬНО - пробелы в конце
some_method()·· 

# ✅ ПРАВИЛЬНО
some_method()
```

## Импорты

### Порядок импортов
```python
# ✅ ПРАВИЛЬНО - три группы, разделенные пустой строкой

# 1. Стандартная библиотека
import os
import sys
from collections.abc import Callable
from datetime import datetime

# 2. Сторонние библиотеки
from fastapi import Depends, FastAPI
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 3. Локальные модули проекта
from app.core.config import settings
from app.models.user import User

# ❌ НЕПРАВИЛЬНО - смешанный порядок
from app.models.user import User
import os
from fastapi import FastAPI
```

### Структура импортов
```python
# ✅ ПРАВИЛЬНО - каждый импорт на отдельной строке
import os
import sys

# ❌ НЕПРАВИЛЬНО
import os, sys

# ✅ ПРАВИЛЬНО - множественный импорт из одного модуля
from collections.abc import Callable, Iterator, Sequence

# ✅ ПРАВИЛЬНО - многострочный импорт при необходимости
from fastapi import (
    APIRouter,
    Depends,
    FastAPI,
    HTTPException,
    status,
)
```

### Абсолютные vs относительные импорты
```python
# ✅ ПРАВИЛЬНО - абсолютные импорты
from app.utils.validators import validate_email
from app.models.user import User

# ⚠️ ДОПУСТИМО - относительные импорты внутри пакета
from .user import User
from ..utils.validators import validate_email

# ❌ НИКОГДА не используйте wildcard
from app.utils import *
```

### Современные импорты типов (Python 3.9+)
```python
# ✅ ПРАВИЛЬНО - встроенные типы (Python 3.9+)
def process(items: list[dict[str, int]]) -> dict[str, list[str]]:
    pass

# ❌ УСТАРЕЛО - не нужно с Python 3.9+
from typing import Dict, List
def process(items: List[Dict[str, int]]) -> Dict[str, List[str]]:
    pass

# ✅ ПРАВИЛЬНО - только специальные типы из typing
from collections.abc import Callable, Iterator, Sequence
from typing import Any, TypeVar, overload
```

## Пробелы и операторы

### Вокруг операторов
```python
# ✅ ПРАВИЛЬНО
total = 1 + 2
a, b = 1, 2
class FooError(Exception): pass

# ❌ НЕПРАВИЛЬНО
total=1+2
a,b=1,2
class FooError(Exception):pass
```

### Исключения для пробелов
```python
# Приоритет операций - можно без пробелов
x = x*2 - 1
hypot2 = x*x + y*y
c = (a+b) * (a-b)
result = a**2 + b**2

# Аргументы по умолчанию - НЕТ пробелов вокруг =
def function(arg1, arg2=None, arg3=False):
    pass

# Аннотации типов - пробел ПОСЛЕ двоеточия, вокруг = для default
def function(arg1: int, arg2: str = "default") -> bool:
    pass
```

### Скобки и квадратные скобки
```python
# ✅ ПРАВИЛЬНО
spam(ham[1], {eggs: 2})
[1, 2, 3].append(4)
{"key": "value"}

# ❌ НЕПРАВИЛЬНО
spam( ham[ 1 ], { eggs: 2 } )
[ 1, 2, 3 ].append( 4 )
{ "key" : "value" }
```

### Форматированные строки (f-strings)
```python
# ✅ ПРАВИЛЬНО
message = f"Hello, {user.name}!"
result = f"Total: {sum(values)}"

# ✅ ПРАВИЛЬНО - debug syntax (Python 3.8+)
print(f"{user_id=}, {status=}")  # user_id=123, status='active'

# ❌ НЕПРАВИЛЬНО - лишние пробелы
message = f"Hello, { user.name }!"
result = f"Total: { sum(values) }"
```

## Пустые строки

### Между функциями и классами
```python
# ✅ ПРАВИЛЬНО - 2 пустые строки на уровне модуля
def some_method():
    data = initialize()
    return data.result


def some_other_method():
    return result


class MyClass:
    pass
```

### Между методами класса
```python
# ✅ ПРАВИЛЬНО - 1 пустая строка
class Foo:
    def __init__(self):
        self.value = 0

    def public_method(self):
        return self._private_method()

    def _private_method(self):
        return self.value
```

### Внутри функций
```python
# ✅ ПРАВИЛЬНО - логические блоки разделены пустой строкой
def process_data():
    # Загрузка данных
    data = load_data()
    validated = validate(data)

    # Обработка
    processed = transform(validated)
    result = aggregate(processed)

    return result
```

## Выражения и операторы

### Одно выражение на строку
```python
# ✅ ПРАВИЛЬНО
print("foo")
print("bar")

# ❌ НЕПРАВИЛЬНО
print("foo"); print("bar")
```

### Точки с запятой
```python
# ❌ НЕПРАВИЛЬНО - не используйте ; в конце выражений
result = calculate();

# ✅ ПРАВИЛЬНО
result = calculate()
```

### Составные операторы
```python
# ✅ ПРАВИЛЬНО
if condition:
    do_something()

# ❌ НЕПРАВИЛЬНО - составные операторы на одной строке
if condition: do_something()
```

## Многострочные конструкции

### Длинные условия
```python
# ✅ ПРАВИЛЬНО - оператор в начале строки
if (
    this_is_one_thing
    and that_is_another_thing
    and one_more_condition
):
    do_something()

# ✅ ПРАВИЛЬНО - тернарный оператор
result = (
    some_function(argument1, argument2)
    if condition
    else other_function()
)
```

### Цепочки методов
```python
# ✅ ПРАВИЛЬНО - точка на новой строке
result = (
    some_object
    .method_one()
    .method_two()
    .method_three()
)

# ✅ ПРАВИЛЬНО - для pandas/SQLAlchemy
df = (
    dataframe
    .filter(condition)
    .groupby("column")
    .agg({"value": "sum"})
)
```

### Аргументы функций
```python
# ✅ ПРАВИЛЬНО - скобки на отдельных строках, trailing comma
def send_mail(
    to: str,
    from_addr: str,
    subject: str,
    body: str,
) -> None:
    pass

# ✅ ПРАВИЛЬНО - вызов функции
result = some_function(
    argument_one,
    argument_two,
    keyword=value,
)
```

### Длинные списки и словари
```python
# ✅ ПРАВИЛЬНО - один элемент на строку, trailing comma
my_list = [
    "first_item",
    "second_item",
    "third_item",
]

config = {
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
}
```

## Комментарии

### Формат комментариев
```python
# ✅ ПРАВИЛЬНО - пробел после #
# This is a comment

# ❌ НЕПРАВИЛЬНО
#This is a comment
```

### Строчные комментарии
```python
# ✅ ПРАВИЛЬНО - 2 пробела перед комментарием
x = x + 1  # Increment x

# ❌ НЕПРАВИЛЬНО
x = x + 1 #No space
x = x + 1# No spaces
```

### TODO-аннотации
```python
# TODO: добавить обработку ошибок
# FIXME: исправить утечку памяти
# HACK: временное решение
# NOTE: важное замечание

# ✅ ПРАВИЛЬНО - с указанием автора/тикета
# TODO(username): добавить валидацию - PROJ-123
# FIXME(alex): исправить race condition - #456
```

## Docstrings

### Google Style (рекомендуется)
```python
def function(arg1: int, arg2: str) -> bool:
    """Brief description of function.

    More detailed description if needed.

    Args:
        arg1: Description of arg1.
        arg2: Description of arg2.

    Returns:
        Description of return value.

    Raises:
        ValueError: If arg1 is negative.

    Examples:
        >>> function(1, "test")
        True
    """
    pass
```

### Однострочный docstring
```python
def simple_function() -> str:
    """Return a greeting message."""
    return "Hello"
```

### Docstring для классов
```python
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
```

## Кавычки и строки

### Выбор кавычек
```python
# ✅ ПРАВИЛЬНО - двойные кавычки (Ruff/Black default)
message = "Hello, World!"

# ✅ ПРАВИЛЬНО - одинарные если строка содержит двойные
sql = 'SELECT * FROM users WHERE name = "John"'

# ✅ ПРАВИЛЬНО - тройные двойные для docstrings
"""This is a docstring."""
```

### Многострочные строки
```python
# ✅ ПРАВИЛЬНО - тройные кавычки
text = """
This is a long text
that spans multiple lines
"""

# ✅ ПРАВИЛЬНО - конкатенация (автоматическая)
text = (
    "This is a long text "
    "that spans multiple lines"
)
```

## Инструменты

### Ruff - линтер и форматтер (рекомендуется)

Ruff заменяет flake8, isort, black и множество других инструментов.
Написан на Rust, работает в 10-100x быстрее.

```bash
# Установка
pip install ruff
# или через uv (рекомендуется)
uv add --dev ruff

# Проверка (lint)
ruff check .
ruff check --fix .  # с автоисправлением

# Форматирование
ruff format .

# Проверка + форматирование
ruff check --fix . && ruff format .
```

### uv - современный менеджер пакетов

Замена pip/poetry, написан на Rust, очень быстрый.

```bash
# Установка uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Создание проекта
uv init myproject
cd myproject

# Добавление зависимостей
uv add fastapi pydantic sqlalchemy
uv add --dev ruff pytest mypy

# Синхронизация окружения
uv sync

# Запуск скриптов
uv run python main.py
uv run pytest
```

### Конфигурация pyproject.toml
```toml
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.109.0",
    "pydantic>=2.5.0",
    "sqlalchemy>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "ruff>=0.2.0",
    "pytest>=8.0.0",
    "mypy>=1.8.0",
]

[tool.ruff]
target-version = "py312"
line-length = 88

[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # pyflakes
    "I",      # isort
    "B",      # flake8-bugbear
    "C4",     # flake8-comprehensions
    "UP",     # pyupgrade
    "ARG",    # flake8-unused-arguments
    "SIM",    # flake8-simplify
]
ignore = [
    "E501",   # line too long (handled by formatter)
    "B008",   # function calls in argument defaults (needed for FastAPI)
]

[tool.ruff.lint.isort]
known-first-party = ["app"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false

[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_ignores = true

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

### Pre-commit hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.2.1
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic, fastapi]

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

### Настройка pre-commit
```bash
# Установка
pip install pre-commit
# или
uv add --dev pre-commit

# Установка hooks
pre-commit install

# Запуск на всех файлах
pre-commit run --all-files
```

## Настройка редактора

### VS Code settings.json
```json
{
    "[python]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.codeActionsOnSave": {
            "source.fixAll": "explicit",
            "source.organizeImports": "explicit"
        }
    },
    "python.analysis.typeCheckingMode": "basic",
    "ruff.lint.args": ["--config=pyproject.toml"],
    "ruff.format.args": ["--config=pyproject.toml"]
}
```

### Рекомендуемые расширения VS Code
- **Ruff** (charliermarsh.ruff) - линтинг и форматирование
- **Python** (ms-python.python) - базовая поддержка Python
- **Pylance** (ms-python.vscode-pylance) - языковой сервер

## Чеклист

- [ ] Используется Python 3.12+
- [ ] Настроен Ruff для линтинга и форматирования
- [ ] Настроены pre-commit hooks
- [ ] pyproject.toml содержит всю конфигурацию
- [ ] Импорты отсортированы и сгруппированы
- [ ] Используются встроенные generic типы (`list[int]` вместо `List[int]`)
- [ ] Все файлы отформатированы единообразно
- [ ] Docstrings в Google Style
