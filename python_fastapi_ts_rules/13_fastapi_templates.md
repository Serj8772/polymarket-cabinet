# FastAPI Templates - Шаблоны (если нужны)

## Общие принципы

- **Jinja2** для серверного рендеринга
- **Разделяйте** логику и представление
- **Переиспользуйте** базовые шаблоны
- **Кэшируйте** статические ресурсы

## Когда использовать шаблоны

### ✅ Подходящие случаи
- Административные панели
- Серверный рендеринг для SEO
- Email шаблоны
- Простые веб-интерфейсы
- Документация внутри приложения

### ❌ Не подходящие случаи
- SPA приложения (используйте React/Vue/Angular)
- REST API без UI
- Высокоинтерактивные интерфейсы
- Мобильные приложения

## Настройка Jinja2

### Конфигурация
```python
# ✅ ПРАВИЛЬНО - настройка шаблонов
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI()

# Статические файлы
app.mount("/static", StaticFiles(directory="static"), name="static")

# Шаблоны
templates = Jinja2Templates(directory="templates")

# Custom filters и globals
templates.env.filters["format_date"] = lambda dt: dt.strftime("%Y-%m-%d")
templates.env.globals["app_name"] = "My App"

@app.get("/")
async def home(request: Request):
    """Render home page."""
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "title": "Home"}
    )
```

### Структура директорий
```
app/
├── templates/
│   ├── base.html           # Базовый шаблон
│   ├── components/         # Переиспользуемые компоненты
│   │   ├── navbar.html
│   │   ├── footer.html
│   │   └── pagination.html
│   ├── pages/              # Страницы
│   │   ├── home.html
│   │   ├── about.html
│   │   └── contact.html
│   ├── admin/              # Админка
│   │   ├── dashboard.html
│   │   └── users.html
│   └── emails/             # Email шаблоны
│       ├── welcome.html
│       └── reset_password.html
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       └── logo.png
└── main.py
```

## Базовые шаблоны

### base.html
```html
<!-- ✅ ПРАВИЛЬНО - базовый шаблон -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}{{ app_name }}{% endblock %}</title>
    
    <!-- CSS -->
    <link rel="stylesheet" href="{{ url_for('static', path='/css/style.css') }}">
    {% block extra_css %}{% endblock %}
    
    <!-- Favicon -->
    <link rel="icon" href="{{ url_for('static', path='/images/favicon.ico') }}">
</head>
<body>
    <!-- Navigation -->
    {% include "components/navbar.html" %}
    
    <!-- Flash messages -->
    {% if messages %}
    <div class="messages">
        {% for message in messages %}
        <div class="alert alert-{{ message.type }}">
            {{ message.text }}
        </div>
        {% endfor %}
    </div>
    {% endif %}
    
    <!-- Main content -->
    <main class="container">
        {% block content %}{% endblock %}
    </main>
    
    <!-- Footer -->
    {% include "components/footer.html" %}
    
    <!-- JavaScript -->
    <script src="{{ url_for('static', path='/js/main.js') }}"></script>
    {% block extra_js %}{% endblock %}
</body>
</html>
```

### Наследование шаблонов
```html
<!-- ✅ ПРАВИЛЬНО - дочерний шаблон -->
<!-- templates/pages/home.html -->
{% extends "base.html" %}

{% block title %}Home - {{ app_name }}{% endblock %}

{% block extra_css %}
<link rel="stylesheet" href="{{ url_for('static', path='/css/home.css') }}">
{% endblock %}

{% block content %}
<h1>Welcome to {{ app_name }}</h1>

<div class="hero">
    <p>{{ description }}</p>
    <a href="{{ url_for('register') }}" class="btn">Get Started</a>
</div>

<div class="features">
    {% for feature in features %}
    <div class="feature-card">
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
    </div>
    {% endfor %}
</div>
{% endblock %}

{% block extra_js %}
<script src="{{ url_for('static', path='/js/home.js') }}"></script>
{% endblock %}
```

## Компоненты

### navbar.html
```html
<!-- ✅ ПРАВИЛЬНО - переиспользуемая навигация -->
<!-- templates/components/navbar.html -->
<nav class="navbar">
    <div class="navbar-brand">
        <a href="{{ url_for('home') }}">
            <img src="{{ url_for('static', path='/images/logo.png') }}" alt="Logo">
        </a>
    </div>
    
    <ul class="navbar-menu">
        <li><a href="{{ url_for('home') }}" 
               class="{% if request.url.path == '/' %}active{% endif %}">Home</a></li>
        <li><a href="{{ url_for('about') }}"
               class="{% if request.url.path == '/about' %}active{% endif %}">About</a></li>
        <li><a href="{{ url_for('contact') }}"
               class="{% if request.url.path == '/contact' %}active{% endif %}">Contact</a></li>
    </ul>
    
    <div class="navbar-auth">
        {% if user %}
        <span>Hello, {{ user.username }}!</span>
        <a href="{{ url_for('logout') }}">Logout</a>
        {% else %}
        <a href="{{ url_for('login') }}">Login</a>
        <a href="{{ url_for('register') }}" class="btn">Sign Up</a>
        {% endif %}
    </div>
</nav>
```

### pagination.html
```html
<!-- ✅ ПРАВИЛЬНО - компонент пагинации -->
<!-- templates/components/pagination.html -->
{% if pages > 1 %}
<nav class="pagination">
    {% if page > 1 %}
    <a href="?page={{ page - 1 }}" class="pagination-prev">Previous</a>
    {% endif %}
    
    <span class="pagination-pages">
        {% for p in range(1, pages + 1) %}
            {% if p == page %}
            <span class="pagination-current">{{ p }}</span>
            {% elif p == 1 or p == pages or (p >= page - 2 and p <= page + 2) %}
            <a href="?page={{ p }}">{{ p }}</a>
            {% elif p == page - 3 or p == page + 3 %}
            <span>...</span>
            {% endif %}
        {% endfor %}
    </span>
    
    {% if page < pages %}
    <a href="?page={{ page + 1 }}" class="pagination-next">Next</a>
    {% endif %}
</nav>
{% endif %}
```

## Работа с формами

### Форма входа
```html
<!-- ✅ ПРАВИЛЬНО - форма с CSRF защитой -->
<!-- templates/auth/login.html -->
{% extends "base.html" %}

{% block content %}
<div class="auth-container">
    <h2>Login</h2>
    
    <form method="POST" action="{{ url_for('login') }}">
        <!-- CSRF token -->
        <input type="hidden" name="csrf_token" value="{{ csrf_token }}">
        
        <!-- Email -->
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" 
                   id="email" 
                   name="email" 
                   value="{{ form.email }}"
                   required>
            {% if errors.email %}
            <span class="error">{{ errors.email }}</span>
            {% endif %}
        </div>
        
        <!-- Password -->
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" 
                   id="password" 
                   name="password" 
                   required>
            {% if errors.password %}
            <span class="error">{{ errors.password }}</span>
            {% endif %}
        </div>
        
        <!-- Remember me -->
        <div class="form-group">
            <label>
                <input type="checkbox" name="remember" value="1">
                Remember me
            </label>
        </div>
        
        <!-- Submit -->
        <button type="submit" class="btn btn-primary">Login</button>
        
        <p class="auth-links">
            <a href="{{ url_for('forgot_password') }}">Forgot password?</a>
            <a href="{{ url_for('register') }}">Create account</a>
        </p>
    </form>
</div>
{% endblock %}
```

### Обработка формы
```python
# ✅ ПРАВИЛЬНО - обработка POST запроса
from fastapi import Form, Request
from fastapi.responses import RedirectResponse

@app.post("/login")
async def login_post(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    remember: bool = Form(False)
):
    """Process login form."""
    errors = {}
    
    # Валидация
    if not email:
        errors["email"] = "Email is required"
    if not password:
        errors["password"] = "Password is required"
    
    if errors:
        return templates.TemplateResponse(
            "auth/login.html",
            {
                "request": request,
                "form": {"email": email},
                "errors": errors
            }
        )
    
    # Аутентификация
    user = await authenticate_user(email, password)
    if not user:
        errors["password"] = "Invalid credentials"
        return templates.TemplateResponse(
            "auth/login.html",
            {
                "request": request,
                "form": {"email": email},
                "errors": errors
            }
        )
    
    # Успешный вход
    response = RedirectResponse(url="/dashboard", status_code=303)
    response.set_cookie("session_id", create_session(user.id))
    return response
```

## Jinja2 Filters и Functions

### Custom filters
```python
# ✅ ПРАВИЛЬНО - кастомные фильтры
from datetime import datetime

def format_datetime(value: datetime, format: str = "%Y-%m-%d %H:%M") -> str:
    """Format datetime."""
    return value.strftime(format)

def truncate_text(value: str, length: int = 100) -> str:
    """Truncate text to length."""
    if len(value) <= length:
        return value
    return value[:length].rsplit(" ", 1)[0] + "..."

def number_format(value: float, decimals: int = 2) -> str:
    """Format number with thousand separators."""
    return f"{value:,.{decimals}f}"

# Регистрация фильтров
templates.env.filters["format_datetime"] = format_datetime
templates.env.filters["truncate"] = truncate_text
templates.env.filters["number_format"] = number_format
```

### Использование фильтров
```html
<!-- ✅ ПРАВИЛЬНО - использование фильтров -->
<div class="post">
    <h2>{{ post.title }}</h2>
    <p class="date">{{ post.created_at|format_datetime }}</p>
    <p>{{ post.content|truncate(200) }}</p>
    <p class="price">${{ post.price|number_format }}</p>
</div>
```

### Global функции
```python
# ✅ ПРАВИЛЬНО - глобальные функции
def current_year() -> int:
    """Get current year."""
    return datetime.now().year

def is_admin(user) -> bool:
    """Check if user is admin."""
    return user and user.is_superuser

# Регистрация globals
templates.env.globals["current_year"] = current_year
templates.env.globals["is_admin"] = is_admin
```

## Email шаблоны

### HTML email
```html
<!-- ✅ ПРАВИЛЬНО - email шаблон -->
<!-- templates/emails/welcome.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f8f9fa;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{ app_name }}!</h1>
        </div>
        
        <div class="content">
            <p>Hi {{ user.username }},</p>
            
            <p>Thank you for joining {{ app_name }}. We're excited to have you on board!</p>
            
            <p>To get started, please verify your email address:</p>
            
            <p style="text-align: center;">
                <a href="{{ verification_url }}" class="button">Verify Email</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p>{{ verification_url }}</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ current_year() }} {{ app_name }}. All rights reserved.</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
```

### Отправка email
```python
# ✅ ПРАВИЛЬНО - отправка email с шаблоном
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

conf = ConnectionConfig(
    MAIL_USERNAME="your-email@example.com",
    MAIL_PASSWORD="your-password",
    MAIL_FROM="noreply@example.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    TEMPLATE_FOLDER="templates/emails"
)

fm = FastMail(conf)

async def send_welcome_email(user: User, verification_token: str):
    """Send welcome email."""
    verification_url = f"https://example.com/verify?token={verification_token}"
    
    # Рендеринг шаблона
    html = templates.get_template("emails/welcome.html").render(
        user=user,
        app_name="My App",
        verification_url=verification_url
    )
    
    message = MessageSchema(
        subject="Welcome to My App",
        recipients=[user.email],
        body=html,
        subtype="html"
    )
    
    await fm.send_message(message)
```

## Контекст процессоры

### Global context
```python
# ✅ ПРАВИЛЬНО - добавление данных во все шаблоны
from fastapi import Request

async def get_common_context(request: Request) -> dict:
    """Get context available in all templates."""
    return {
        "app_name": "My App",
        "current_year": datetime.now().year,
        "user": await get_current_user(request),
        "request": request
    }

# Middleware для добавления контекста
@app.middleware("http")
async def add_template_context(request: Request, call_next):
    """Add common context to all template responses."""
    request.state.template_context = await get_common_context(request)
    response = await call_next(request)
    return response

# Использование в route
@app.get("/")
async def home(request: Request):
    """Home page with common context."""
    context = {
        **request.state.template_context,
        "title": "Home",
        "featured_posts": await get_featured_posts()
    }
    return templates.TemplateResponse("pages/home.html", context)
```

## HTMX Integration

### Динамические обновления без JavaScript
```html
<!-- ✅ ПРАВИЛЬНО - использование HTMX -->
<!-- templates/pages/posts.html -->
{% extends "base.html" %}

{% block extra_css %}
<script src="https://unpkg.com/htmx.org@1.9.10"></script>
{% endblock %}

{% block content %}
<h1>Posts</h1>

<!-- Поиск с автообновлением -->
<input type="search" 
       name="search" 
       placeholder="Search posts..."
       hx-get="/search-posts"
       hx-trigger="keyup changed delay:500ms"
       hx-target="#posts-list">

<!-- Список постов -->
<div id="posts-list">
    {% include "components/posts_list.html" %}
</div>

<!-- Кнопка "Load More" -->
<button hx-get="/posts?page={{ page + 1 }}"
        hx-target="#posts-list"
        hx-swap="beforeend"
        hx-indicator="#spinner">
    Load More
</button>

<div id="spinner" class="htmx-indicator">Loading...</div>
{% endblock %}
```

### HTMX endpoints
```python
# ✅ ПРАВИЛЬНО - endpoints для HTMX
@app.get("/search-posts")
async def search_posts(
    request: Request,
    search: str = ""
):
    """Search posts (returns HTML fragment)."""
    posts = await search_posts_db(search)
    
    return templates.TemplateResponse(
        "components/posts_list.html",
        {"request": request, "posts": posts}
    )

@app.get("/posts")
async def load_more_posts(
    request: Request,
    page: int = 1
):
    """Load more posts (returns HTML fragment)."""
    posts = await get_posts_paginated(page)
    
    return templates.TemplateResponse(
        "components/posts_list.html",
        {"request": request, "posts": posts, "page": page}
    )
```

## Flash Messages

### Flash messages middleware
```python
# ✅ ПРАВИЛЬНО - flash messages
from starlette.middleware.sessions import SessionMiddleware

app.add_middleware(SessionMiddleware, secret_key="your-secret-key")

def flash(request: Request, message: str, category: str = "info"):
    """Add flash message to session."""
    if "messages" not in request.session:
        request.session["messages"] = []
    request.session["messages"].append({
        "text": message,
        "type": category
    })

def get_flashed_messages(request: Request) -> list:
    """Get and clear flash messages."""
    messages = request.session.pop("messages", [])
    return messages

# Использование
@app.post("/users")
async def create_user(request: Request, user_in: UserCreate):
    """Create user with flash message."""
    user = await user_crud.create(db, obj_in=user_in)
    
    flash(request, "User created successfully!", "success")
    
    return RedirectResponse(url="/users", status_code=303)

# В шаблоне
@app.get("/users")
async def list_users(request: Request):
    """List users with flash messages."""
    return templates.TemplateResponse(
        "users/list.html",
        {
            "request": request,
            "users": await get_users(),
            "messages": get_flashed_messages(request)
        }
    )
```

## Админ панель

### Dashboard
```html
<!-- ✅ ПРАВИЛЬНО - простая админ панель -->
<!-- templates/admin/dashboard.html -->
{% extends "base.html" %}

{% block content %}
<div class="admin-dashboard">
    <h1>Admin Dashboard</h1>
    
    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Users</h3>
            <p class="stat-number">{{ stats.total_users }}</p>
        </div>
        
        <div class="stat-card">
            <h3>Active Users</h3>
            <p class="stat-number">{{ stats.active_users }}</p>
        </div>
        
        <div class="stat-card">
            <h3>Total Posts</h3>
            <p class="stat-number">{{ stats.total_posts }}</p>
        </div>
        
        <div class="stat-card">
            <h3>Today's Signups</h3>
            <p class="stat-number">{{ stats.today_signups }}</p>
        </div>
    </div>
    
    <!-- Recent activity -->
    <div class="recent-activity">
        <h2>Recent Activity</h2>
        <table>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                {% for activity in recent_activities %}
                <tr>
                    <td>{{ activity.user.username }}</td>
                    <td>{{ activity.action }}</td>
                    <td>{{ activity.created_at|format_datetime }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</div>
{% endblock %}
```

## Чеклист шаблонов

- [ ] Jinja2 настроен правильно
- [ ] Статические файлы в отдельной директории
- [ ] Базовый шаблон для наследования
- [ ] Компоненты для переиспользования
- [ ] Custom filters для форматирования
- [ ] CSRF защита для форм
- [ ] Flash messages для уведомлений
- [ ] Email шаблоны для писем
- [ ] Правильная обработка ошибок валидации
- [ ] HTMX для динамических обновлений (опционально)
