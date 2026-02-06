# Python Strings - Строки

> **Python 3.12 Update:** Используйте `removeprefix()`/`removesuffix()` вместо `lstrip()`/`rstrip()` для удаления конкретных подстрок.

## Общие принципы

- Используйте **f-strings** для форматирования (Python 3.6+)
- Строки в Python **неизменяемые** (immutable)
- Предпочитайте **двойные кавычки** для консистентности
- Используйте **str.join()** для объединения множества строк

## Создание строк

### Кавычки
```python
# ✅ ПРАВИЛЬНО - двойные кавычки для обычных строк
message = "Hello, World!"
name = "John"

# ✅ ПРАВИЛЬНО - одинарные если строка содержит двойные
sql = 'SELECT * FROM users WHERE name = "John"'
text = 'He said "Hello"'

# ✅ ПРАВИЛЬНО - тройные кавычки для многострочных
docstring = """
This is a docstring.
It can span multiple lines.
"""

multiline = '''
First line
Second line
Third line
'''

# ❌ НЕПРАВИЛЬНО - непоследовательное использование
message1 = "Hello"
message2 = 'World'
message3 = "Test"
```

### Экранирование символов
```python
# ✅ ПРАВИЛЬНО - экранирование специальных символов
path = "C:\\Users\\John\\Documents"
quote = "He said \"Hello\""
newline = "First line\nSecond line"
tab = "Column1\tColumn2"

# ✅ ПРАВИЛЬНО - raw strings для регулярных выражений
pattern = r"\d{3}-\d{2}-\d{4}"
windows_path = r"C:\Users\John\Documents"

# ❌ НЕПРАВИЛЬНО - забытое экранирование
path = "C:\Users\John"  # \U - неправильная escape последовательность!
```

### Пустые строки
```python
# ✅ ПРАВИЛЬНО - проверка на пустоту
text = "  "

if text:  # Проверка на непустую строку
    print("Not empty")

if not text:  # Проверка на пустоту
    print("Empty")

if text.strip():  # Проверка после удаления пробелов
    print("Has content")

# ❌ НЕПРАВИЛЬНО - сравнение с пустой строкой
if text == "":  # Работает, но менее питонично
    pass

if len(text) == 0:  # Избыточно
    pass
```

## Форматирование строк

### F-strings (Python 3.6+) - РЕКОМЕНДУЕТСЯ
```python
# ✅ ПРАВИЛЬНО - f-strings для форматирования
name = "John"
age = 30
city = "London"

# Простая подстановка
message = f"Hello, {name}!"

# Выражения внутри f-string
total = f"Total: {price * quantity}"

# Форматирование чисел
price = 19.99
formatted = f"Price: ${price:.2f}"  # "Price: $19.99"

# Выравнивание и ширина
text = f"{name:>10}"  # Выравнивание вправо
text = f"{name:<10}"  # Выравнивание влево
text = f"{name:^10}"  # По центру

# Форматирование даты
from datetime import datetime
now = datetime.now()
formatted = f"Date: {now:%Y-%m-%d %H:%M:%S}"

# Вызов методов
message = f"Hello, {name.upper()}!"

# Вложенные f-strings
width = 10
text = f"{name:>{width}}"

# ✅ Debug syntax (Python 3.8+) - выводит имя и значение
user_id = 123
status = "active"
print(f"{user_id=}, {status=}")  # user_id=123, status='active'

# С форматированием
value = 3.14159
print(f"{value=:.2f}")  # value=3.14

# ❌ НЕПРАВИЛЬНО - конкатенация вместо f-string
message = "Hello, " + name + "! You are " + str(age) + " years old."
```

### Format метод
```python
# ✅ ПРАВИЛЬНО - format() для шаблонов многократного использования
template = "Name: {name}, Age: {age}, City: {city}"

user1 = template.format(name="John", age=30, city="London")
user2 = template.format(name="Jane", age=25, city="Paris")

# Позиционные аргументы
message = "{0} is {1} years old".format(name, age)

# С форматированием
message = "Price: {:.2f}".format(19.999)  # "Price: 20.00"

# ✅ ПРАВИЛЬНО - но f-strings предпочтительнее
message = f"Name: {name}, Age: {age}, City: {city}"
```

### Процентное форматирование (устарело)
```python
# ❌ НЕПРАВИЛЬНО - старый стиль (не используйте)
message = "Hello, %s! You are %d years old." % (name, age)

# ✅ ПРАВИЛЬНО - используйте f-strings вместо этого
message = f"Hello, {name}! You are {age} years old."
```

### Многострочные f-strings
```python
# ✅ ПРАВИЛЬНО - многострочные f-strings
user = {
    "name": "John",
    "age": 30,
    "email": "john@example.com"
}

message = f"""
User Information:
  Name: {user['name']}
  Age: {user['age']}
  Email: {user['email']}
"""

# ✅ ПРАВИЛЬНО - с выражениями
report = f"""
Total items: {len(items)}
Total price: ${sum(item.price for item in items):.2f}
Average: ${sum(item.price for item in items) / len(items):.2f}
"""
```

## Методы строк

### Изменение регистра
```python
# ✅ ПРАВИЛЬНО - методы изменения регистра
text = "Hello World"

upper = text.upper()        # "HELLO WORLD"
lower = text.lower()        # "hello world"
title = text.title()        # "Hello World"
capitalize = text.capitalize()  # "Hello world"
swapcase = text.swapcase()  # "hELLO wORLD"

# Проверка регистра
is_upper = text.isupper()   # False
is_lower = text.islower()   # False
is_title = text.istitle()   # True
```

### Удаление пробелов
```python
# ✅ ПРАВИЛЬНО - strip методы
text = "  Hello World  "

stripped = text.strip()      # "Hello World"
left = text.lstrip()         # "Hello World  "
right = text.rstrip()        # "  Hello World"

# Удаление конкретных символов
text = "...Hello..."
cleaned = text.strip(".")    # "Hello"

# ❌ НЕПРАВИЛЬНО - замена пробелов на пустую строку
cleaned = text.replace(" ", "")  # Удалит все пробелы, а не только по краям
```

### Удаление префикса/суффикса (Python 3.9+)
```python
# ✅ ПРАВИЛЬНО - removeprefix/removesuffix для конкретных подстрок
filename = "test_file.py"
name = filename.removesuffix(".py")     # "test_file"

url = "https://example.com"
domain = url.removeprefix("https://")   # "example.com"

# ❌ НЕПРАВИЛЬНО - lstrip/rstrip удаляют СИМВОЛЫ, не подстроки!
text = "https://example.com"
text.lstrip("https://")  # "example.com" - случайно работает
text = "http://example.com"
text.lstrip("http://")   # "example.com" - тоже работает, но неправильно!

# lstrip удаляет любые символы из набора
"https://example.com".lstrip("htps:/")  # "example.com"
"mississippi".lstrip("mis")              # "ppi" (не "sissippi"!)
```

### Поиск и замена
```python
# ✅ ПРАВИЛЬНО - поиск подстрок
text = "Hello World"

# Проверка наличия
contains = "World" in text   # True

# Поиск позиции
index = text.find("World")   # 6
index = text.index("World")  # 6 (вызовет ValueError если не найдено)

# Проверка начала/конца
starts = text.startswith("Hello")  # True
ends = text.endswith("World")      # True

# Замена
replaced = text.replace("World", "Python")  # "Hello Python"
replaced = text.replace("l", "L", 1)  # "HeLlo World" (только первое)

# Количество вхождений
count = text.count("l")      # 3
```

### Разделение и объединение
```python
# ✅ ПРАВИЛЬНО - split и join
text = "apple,banana,cherry"

# Разделение
fruits = text.split(",")     # ["apple", "banana", "cherry"]
words = "hello world".split()  # ["hello", "world"] (по пробелам)

# Разделение с ограничением
parts = text.split(",", 1)   # ["apple", "banana,cherry"]

# Объединение
joined = ", ".join(fruits)   # "apple, banana, cherry"
path = "/".join(["usr", "local", "bin"])  # "usr/local/bin"

# ❌ НЕПРАВИЛЬНО - конкатенация в цикле
result = ""
for fruit in fruits:
    result += fruit + ", "   # Создает новую строку каждый раз!

# ✅ ПРАВИЛЬНО - используйте join
result = ", ".join(fruits)

# Разделение на строки
multiline = "First\nSecond\nThird"
lines = multiline.splitlines()  # ["First", "Second", "Third"]
```

### Выравнивание и заполнение
```python
# ✅ ПРАВИЛЬНО - выравнивание строк
text = "Hello"

# Выравнивание
left = text.ljust(10)        # "Hello     "
right = text.rjust(10)       # "     Hello"
center = text.center(10)     # "  Hello   "

# С заполнением
padded = text.ljust(10, "-") # "Hello-----"
padded = text.rjust(10, "*") # "*****Hello"
padded = text.center(10, "=") # "==Hello==="

# Заполнение нулями
number = "42"
padded = number.zfill(5)     # "00042"
```

### Проверка содержимого
```python
# ✅ ПРАВИЛЬНО - проверка типа содержимого
text = "hello123"

is_alpha = text.isalpha()    # False (есть цифры)
is_digit = text.isdigit()    # False (есть буквы)
is_alnum = text.isalnum()    # True (буквы и цифры)
is_space = "   ".isspace()   # True

# Проверка конкретных строк
email = "user@example.com"
is_valid = "@" in email and "." in email

# Более надежная валидация
import re
is_valid = bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))
```

## Конкатенация строк

### Простая конкатенация
```python
# ✅ ПРАВИЛЬНО - для небольшого количества строк
first = "Hello"
last = "World"
full = first + " " + last    # "Hello World"

# ✅ ПРАВИЛЬНО - f-string для форматирования
full = f"{first} {last}"

# ❌ НЕПРАВИЛЬНО - конкатенация в цикле
result = ""
for i in range(1000):
    result += str(i)  # Создает новую строку каждый раз!

# ✅ ПРАВИЛЬНО - join для множества строк
result = "".join(str(i) for i in range(1000))

# ✅ ПРАВИЛЬНО - list + join для условной конкатенации
parts = []
if first_name:
    parts.append(first_name)
if last_name:
    parts.append(last_name)
full_name = " ".join(parts)
```

### StringBuilder паттерн
```python
# ✅ ПРАВИЛЬНО - список для накопления строк
parts = []
for item in items:
    parts.append(f"- {item}")
result = "\n".join(parts)

# ✅ ПРАВИЛЬНО - с list comprehension
result = "\n".join(f"- {item}" for item in items)

# ❌ НЕПРАВИЛЬНО
result = ""
for item in items:
    result += f"- {item}\n"
```

## Работа с Unicode

### Кодировки
```python
# ✅ ПРАВИЛЬНО - работа с кодировками
text = "Привет, мир! 你好"

# Кодирование в байты
encoded = text.encode("utf-8")
encoded = text.encode("utf-8", errors="ignore")  # Игнорировать ошибки

# Декодирование из байт
decoded = encoded.decode("utf-8")

# ✅ ПРАВИЛЬНО - чтение файлов с кодировкой
with open("file.txt", "r", encoding="utf-8") as f:
    content = f.read()

# ❌ НЕПРАВИЛЬНО - без указания кодировки
with open("file.txt", "r") as f:  # Может вызвать проблемы
    content = f.read()
```

### Unicode символы
```python
# ✅ ПРАВИЛЬНО - работа с Unicode
emoji = "😀"
chinese = "中文"
arabic = "العربية"

# Длина строки vs длина в байтах
text = "Hello 😀"
char_length = len(text)              # 7 символов
byte_length = len(text.encode())     # 10 байт

# Unicode escape последовательности
heart = "\u2764"  # ❤
smile = "\U0001F600"  # 😀
```

## Регулярные выражения

### Базовое использование
```python
# ✅ ПРАВИЛЬНО - компиляция регулярных выражений
import re

# Компиляция паттерна (эффективнее для многократного использования)
email_pattern = re.compile(r"[^@]+@[^@]+\.[^@]+")

# Поиск
text = "Contact: john@example.com"
match = email_pattern.search(text)
if match:
    email = match.group()  # "john@example.com"

# Все совпадения
text = "Emails: john@example.com, jane@example.com"
emails = email_pattern.findall(text)

# Замена
text = "Price: $100"
cleaned = re.sub(r"\$(\d+)", r"\1 USD", text)  # "Price: 100 USD"

# ✅ ПРАВИЛЬНО - raw strings для паттернов
pattern = r"\d{3}-\d{2}-\d{4}"  # SSN паттерн

# ❌ НЕПРАВИЛЬНО - без raw string
pattern = "\d{3}-\d{2}-\d{4}"  # \d может интерпретироваться неправильно
```

### Валидация с regex
```python
# ✅ ПРАВИЛЬНО - распространенные паттерны
import re

def validate_email(email: str) -> bool:
    """Validate email address."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    """Validate phone number (US format)."""
    pattern = r"^\+?1?\d{10}$"
    return bool(re.match(pattern, phone.replace("-", "").replace(" ", "")))

def validate_url(url: str) -> bool:
    """Validate URL."""
    pattern = r"^https?://[^\s/$.?#].[^\s]*$"
    return bool(re.match(pattern, url))

# Извлечение данных
text = "Order #12345 for $99.99"
order_number = re.search(r"#(\d+)", text).group(1)  # "12345"
price = re.search(r"\$(\d+\.\d+)", text).group(1)   # "99.99"
```

## Шаблоны и Template Strings

### string.Template
```python
# ✅ ПРАВИЛЬНО - безопасные шаблоны из пользовательского ввода
from string import Template

# Простой шаблон
template = Template("Hello, $name! Welcome to $place.")
message = template.substitute(name="John", place="Python")

# Безопасная подстановка (не вызовет ошибку)
message = template.safe_substitute(name="John")  # $place останется

# ✅ ПРАВИЛЬНО - для пользовательских шаблонов
user_template = "Hello, $username!"
template = Template(user_template)
message = template.safe_substitute(username=user_input)

# ❌ НЕПРАВИЛЬНО - eval/exec с пользовательским вводом
# НЕ ДЕЛАЙТЕ ТАК - небезопасно!
# message = eval(f'f"{user_template}"')
```

## Производительность

### Оптимизация строковых операций
```python
# ✅ ПРАВИЛЬНО - эффективные операции
# Join вместо конкатенации
parts = [str(i) for i in range(1000)]
result = "".join(parts)

# ❌ НЕПРАВИЛЬНО - медленная конкатенация
result = ""
for i in range(1000):
    result += str(i)

# ✅ ПРАВИЛЬНО - list comprehension + join
result = "".join(str(i) for i in range(1000))

# ✅ ПРАВИЛЬНО - переиспользование скомпилированных регулярок
import re
pattern = re.compile(r"\d+")
for text in texts:
    matches = pattern.findall(text)

# ❌ НЕПРАВИЛЬНО - компиляция в цикле
for text in texts:
    matches = re.findall(r"\d+", text)  # Компилирует каждый раз
```

### Проверка вхождения
```python
# ✅ ПРАВИЛЬНО - используйте 'in' для проверки
text = "Hello World"
if "World" in text:
    pass

# ✅ ПРАВИЛЬНО - для множества проверок используйте set
valid_codes = {"admin", "user", "guest"}
if user_code in valid_codes:  # O(1)
    pass

# ❌ НЕПРАВИЛЬНО - find для проверки вхождения
if text.find("World") != -1:  # Работает, но менее читаемо
    pass
```

## Pydantic валидация строк

### Встроенные валидаторы
```python
# ✅ ПРАВИЛЬНО - используйте Pydantic для валидации
from pydantic import BaseModel, EmailStr, HttpUrl, Field, validator

class User(BaseModel):
    """User model with string validation."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr  # Автоматическая валидация email
    website: HttpUrl | None = None  # Автоматическая валидация URL
    bio: str = Field(..., max_length=500)
    
    @validator("username")
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v.lower()
    
    @validator("bio")
    def validate_bio(cls, v: str) -> str:
        """Clean and validate bio."""
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Bio cannot be empty")
        return cleaned
```

### Кастомные типы строк
```python
# ✅ ПРАВИЛЬНО - кастомные строковые типы
from pydantic import BaseModel, constr

class Product(BaseModel):
    """Product with constrained strings."""
    # Строка с ограничениями
    name: constr(min_length=1, max_length=100)
    # Строка с паттерном
    sku: constr(regex=r"^[A-Z]{3}-\d{6}$")
    # Строка с lowercase
    slug: constr(to_lower=True, regex=r"^[a-z0-9-]+$")
```

## SQL инъекции и безопасность

### Безопасная работа с SQL
```python
# ❌ НЕПРАВИЛЬНО - SQL инъекция!
username = request.get("username")
query = f"SELECT * FROM users WHERE username = '{username}'"
# Пользователь может ввести: ' OR '1'='1

# ✅ ПРАВИЛЬНО - параметризованные запросы
from sqlalchemy import text

username = request.get("username")
query = text("SELECT * FROM users WHERE username = :username")
result = db.execute(query, {"username": username})

# ✅ ПРАВИЛЬНО - SQLAlchemy ORM
from sqlalchemy import select

stmt = select(User).where(User.username == username)
result = db.execute(stmt)
```

### Безопасная работа с путями
```python
# ❌ НЕПРАВИЛЬНО - path traversal уязвимость
filename = request.get("file")
path = f"/uploads/{filename}"  # Пользователь может ввести: ../../etc/passwd

# ✅ ПРАВИЛЬНО - валидация пути
from pathlib import Path

def safe_path(base_dir: str, filename: str) -> Path:
    """Create safe file path."""
    base = Path(base_dir).resolve()
    file_path = (base / filename).resolve()
    
    # Проверка что путь внутри base_dir
    if not str(file_path).startswith(str(base)):
        raise ValueError("Invalid file path")
    
    return file_path

path = safe_path("/uploads", filename)
```

## Type Hints для строк

### Аннотации типов
```python
# ✅ ПРАВИЛЬНО - type hints для строк
def format_name(first: str, last: str) -> str:
    """Format full name."""
    return f"{first} {last}"

def split_text(text: str, delimiter: str = ",") -> list[str]:
    """Split text by delimiter."""
    return text.split(delimiter)

# Опциональные строки
def greet(name: str | None = None) -> str:
    """Greet user."""
    if name is None:
        return "Hello, Guest!"
    return f"Hello, {name}!"

# Literal для фиксированных значений
from typing import Literal

def set_log_level(level: Literal["DEBUG", "INFO", "WARNING", "ERROR"]) -> None:
    """Set logging level."""
    pass
```

## Чеклист строк

- [ ] Используются f-strings для форматирования
- [ ] Консистентное использование кавычек (двойные по умолчанию)
- [ ] join() для объединения множества строк
- [ ] strip() для удаления пробелов
- [ ] Raw strings (r"") для регулярных выражений
- [ ] Указана кодировка при работе с файлами
- [ ] Параметризованные запросы для SQL
- [ ] Валидация пользовательского ввода
- [ ] Type hints для всех строковых параметров
- [ ] Избегание конкатенации в циклах
