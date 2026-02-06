# Polymarket Personal Cabinet - Техническая спецификация

---

## 1. СИСТЕМНЫЙ ПРОМПТ

```
Ты — Senior Full Stack разработчик аналитической платформы для Polymarket (Personal Cabinet).
Это многопользовательская платформа с Web3 аутентификацией через MetaMask.

ТЕХНИЧЕСКИЙ СТЕК:
- Backend: Python 3.12+, FastAPI, Pydantic V2, SQLAlchemy 2.0 (async)
- Frontend: TypeScript 5+, React 19, TailwindCSS, Vite
- Web3: wagmi v2, viem, @web3modal/wagmi (фронтенд), py-clob-client (бэкенд)
- БД: PostgreSQL 16 + Redis 7 (кэширование, pub/sub)
- API: REST + WebSocket для real-time данных
- Тесты: pytest + pytest-asyncio (backend), Vitest + React Testing Library (frontend)
- Инфраструктура: Docker Compose, Alembic (миграции)

ПРИНЦИПЫ:
- Async-first: весь backend код асинхронный
- Type-safe: строгая типизация на обеих сторонах (Pydantic + TypeScript strict)
- Security-first: приватные ключи никогда не передаются и не хранятся на сервере
- Кэширование: все данные Polymarket кэшируются в Redis с чёткими TTL
- Polymarket SDK: используй py-clob-client для взаимодействия с CLOB API

ПРАВИЛА КОДИРОВАНИЯ:
ОБЯЗАТЕЛЬНО следуй правилам из директории python_fastapi_ts_rules/.
Перед написанием любого кода — прочитай соответствующий файл правил.
При ревью кода — сверяй с правилами.
Подробный перечень правил — см. Секцию 1.1 ниже.
```

### 1.1 Правила кодирования (python_fastapi_ts_rules/)

**ВАЖНО:** Директория `python_fastapi_ts_rules/` содержит 24 файла с обязательными правилами и стандартами кодирования для этого проекта. Все файлы ДОЛЖНЫ быть прочитаны и соблюдены.

**Как использовать:**
- Перед началом работы над модулем — прочитай соответствующие файлы правил
- При написании Python кода — сверяйся с файлами 01-09
- При написании FastAPI кода — сверяйся с файлами 10-18
- При написании TypeScript/React кода — сверяйся с файлами 19-24
- При code review — проверяй соответствие правилам

#### Python (01-09)

| Файл | Тема | Когда читать |
|------|------|-------------|
| `01_python_basics.md` | Основы Python: типы, переменные, операторы | При написании любого Python кода |
| `02_python_naming.md` | Именование: переменные, функции, классы, модули | При создании новых сущностей |
| `03_python_functions.md` | Функции: параметры, возвраты, декораторы | При написании функций и утилит |
| `04_python_classes.md` | Классы: наследование, миксины, dataclasses | При создании моделей и сервисов |
| `05_python_collections.md` | Коллекции: list, dict, set, comprehensions | При работе с данными |
| `06_python_strings.md` | Строки: форматирование, f-strings, regex | При работе с текстом |
| `07_python_flow_control.md` | Управление потоком: if/else, циклы, match | При написании логики |
| `08_python_exceptions.md` | Исключения: try/except, кастомные ошибки | При обработке ошибок |
| `09_python_async.md` | **Async: asyncio, TaskGroup, семафоры, таймауты** | **При любом async коде (критично для этого проекта)** |

#### FastAPI (10-18)

| Файл | Тема | Когда читать |
|------|------|-------------|
| `10_fastapi_structure.md` | **Структура проекта: модули, слои, lifespan** | **При создании новых модулей (критично)** |
| `11_fastapi_models.md` | Pydantic модели и SQLAlchemy ORM | При создании схем и моделей БД |
| `12_fastapi_routes.md` | Роуты: эндпоинты, параметры, зависимости | При создании API endpoints |
| `13_fastapi_templates.md` | Шаблоны (Jinja2) | Не используется в этом проекте (SPA) |
| `14_fastapi_database.md` | БД: async sessions, миграции, CRUD | При работе с PostgreSQL |
| `15_python_testing.md` | Тестирование: pytest, фикстуры, моки | При написании тестов |
| `16_fastapi_security.md` | **Безопасность: JWT, RBAC, rate limiting, CORS** | **При работе с auth и security (критично)** |
| `17_python_performance.md` | Производительность: профилирование, оптимизация | При оптимизации |
| `18_fastapi_api.md` | API дизайн: версионирование, пагинация, ошибки | При проектировании REST API |

#### TypeScript & React (19-24)

| Файл | Тема | Когда читать |
|------|------|-------------|
| `19_typescript_basics.md` | Основы TypeScript: типы, интерфейсы, generics | При написании любого TS кода |
| `20_typescript_naming.md` | Именование в TypeScript | При создании новых сущностей |
| `21_typescript_functions.md` | Функции: типизация, перегрузки | При написании утилит и хуков |
| `22_typescript_classes.md` | Классы в TypeScript | При создании сервисов |
| `23_react_frontend.md` | **React 19: компоненты, хуки, Zustand, роутинг** | **При любой работе с фронтендом (критично)** |
| `24_typescript_testing.md` | Тестирование: Vitest, React Testing Library | При написании frontend тестов |

#### Критичные файлы для этого проекта

Следующие файлы правил НАИБОЛЕЕ важны и должны быть прочитаны в первую очередь:

1. **`09_python_async.md`** — весь backend построен на async, паттерны TaskGroup, семафоры, таймауты
2. **`10_fastapi_structure.md`** — каноническая структура проекта (lifespan, config, deps, CRUD, services)
3. **`16_fastapi_security.md`** — JWT аутентификация, RBAC, rate limiting, CORS
4. **`23_react_frontend.md`** — React 19 паттерны, Zustand, компонентная архитектура
5. **`14_fastapi_database.md`** — async SQLAlchemy, сессии, миграции Alembic
6. **`18_fastapi_api.md`** — REST API дизайн, пагинация, обработка ошибок

---

## 2. POLYMARKET API REFERENCE

### 2.1 Три API Polymarket

| API | URL | Назначение | Auth |
|-----|-----|-----------|------|
| **Gamma API** | `https://gamma-api.polymarket.com` | Метаданные рынков, поиск, фильтрация | Не требуется |
| **CLOB API** | `https://clob.polymarket.com` | Торговые операции, orderbook, ордера | L1/L2 |
| **Data API** | `https://data-api.polymarket.com` | Позиции пользователя, история сделок | Не требуется (по wallet) |

### 2.2 WebSocket Endpoints

| Endpoint | Назначение |
|----------|-----------|
| `wss://ws-subscriptions-clob.polymarket.com/ws/` | Подписки на orderbook, trade events |
| `wss://ws-live-data.polymarket.com` | Real-time цены, market updates |

- Лимит: макс 500 инструментов на подключение
- Каналы: user channel (ордера пользователя), market channel (цены, trades)

### 2.3 Аутентификация Polymarket (L1/L2)

**Level 1 (L1)** — подпись EIP-712 сообщения приватным ключом кошелька:
- Доказывает владение кошельком
- Приватный ключ остаётся у пользователя (non-custodial)

**Level 2 (L2)** — API credentials, генерируемые из L1:
- `apiKey` (UUID) + `secret` (base64) + `passphrase` (random string)
- Генерируются через `POST /auth/api-key` на CLOB API
- Все CLOB запросы подписываются HMAC-SHA256
- В py-clob-client: метод `create_or_derive_api_creds()`

### 2.4 Ключевые Endpoints

**Gamma API (публичные, без auth):**
```
GET /markets                         — список всех рынков
GET /markets?slug={slug}             — поиск по slug
GET /markets?tag={tag}               — фильтрация по тегу
GET /markets?closed=false&active=true — активные рынки
```

**CLOB API (требует L2 auth для write-операций):**
```
GET  /price?token_id={id}&side=buy   — текущая цена (публичный)
GET  /book?token_id={id}             — orderbook (публичный)
GET  /midpoint?token_id={id}         — midpoint цена (публичный)
POST /order                          — создать ордер (L2 auth)
DELETE /order/{id}                   — отменить ордер (L2 auth)
GET  /orders?market={id}             — список ордеров (L2 auth)
POST /auth/api-key                   — получить API credentials (L1 auth)
```

**Data API (публичные, по wallet address):**
```
GET /activity?address={wallet}       — история активности
GET /positions?address={wallet}      — текущие позиции
GET /trades?address={wallet}         — история сделок
```

### 2.5 Rate Limits

| API | Лимит | Примечание |
|-----|-------|-----------|
| Gamma API | ~1000 req/hr | Throttling через Cloudflare |
| CLOB API (read) | ~100 req/min | Для ценовых данных |
| CLOB API (write) | Строже | Для торговых операций |
| WebSocket | 500 инструментов/conn | Макс подписок |

### 2.6 Официальные SDK

**py-clob-client** (Python, официальный):
```
pip install py-clob-client
```
- Python 3.9+
- Market data, limit/market orders, cancel, API credentials
- Поддержка MetaMask, hardware wallets, proxy wallets

---

## 3. АРХИТЕКТУРА

### 3.1 Структура проекта

```
polymarket-cabinet/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI приложение + lifespan
│   │   │
│   │   ├── api/                       # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                # Общие зависимости (get_current_user, get_db)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py          # Главный роутер v1
│   │   │       └── endpoints/
│   │   │           ├── __init__.py
│   │   │           ├── auth.py        # Web3 аутентификация
│   │   │           ├── markets.py     # Рынки Polymarket
│   │   │           ├── portfolio.py   # Портфель, позиции, PnL
│   │   │           ├── orders.py      # Создание/отмена ордеров
│   │   │           ├── charts.py      # Ценовые данные, графики
│   │   │           └── ws.py          # WebSocket endpoint для клиентов
│   │   │
│   │   ├── core/                      # Ядро приложения
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Pydantic Settings
│   │   │   ├── security.py           # JWT, шифрование API creds
│   │   │   └── logging.py            # Структурированные логи
│   │   │
│   │   ├── db/                        # База данных
│   │   │   ├── __init__.py
│   │   │   ├── base.py               # Base + TimestampMixin
│   │   │   ├── session.py            # Async engine + session factory
│   │   │   └── init_db.py            # Инициализация
│   │   │
│   │   ├── models/                    # SQLAlchemy модели
│   │   │   ├── __init__.py
│   │   │   ├── user.py               # User (wallet_address, encrypted_api_creds)
│   │   │   ├── position.py           # Position (кэш позиций)
│   │   │   ├── order.py              # Order (история ордеров)
│   │   │   ├── market.py             # Market (кэш данных рынка)
│   │   │   └── price_snapshot.py     # PriceSnapshot (для OHLCV)
│   │   │
│   │   ├── schemas/                   # Pydantic схемы
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── market.py
│   │   │   ├── portfolio.py
│   │   │   ├── order.py
│   │   │   └── chart.py
│   │   │
│   │   ├── crud/                      # CRUD операции
│   │   │   ├── __init__.py
│   │   │   ├── base.py               # Базовый CRUD (Generic)
│   │   │   ├── user.py
│   │   │   ├── market.py
│   │   │   └── price_snapshot.py
│   │   │
│   │   ├── services/                  # Бизнес-логика
│   │   │   ├── __init__.py
│   │   │   ├── polymarket_client.py   # Обёртка над py-clob-client
│   │   │   ├── market_service.py      # Работа с рынками (Gamma API)
│   │   │   ├── portfolio_service.py   # Портфель, позиции (Data API)
│   │   │   ├── order_service.py       # Ордера (CLOB API)
│   │   │   ├── price_service.py       # Ценовые данные, snapshots
│   │   │   ├── ws_relay_service.py    # WebSocket relay (Polymarket → Redis → клиенты)
│   │   │   └── scheduler_service.py   # APScheduler фоновые задачи
│   │   │
│   │   ├── utils/                     # Утилиты
│   │   │   ├── __init__.py
│   │   │   ├── crypto.py             # Шифрование API credentials (Fernet)
│   │   │   └── redis_client.py       # Redis async клиент
│   │   │
│   │   └── middleware/                # Middleware
│   │       ├── __init__.py
│   │       ├── rate_limiter.py        # Rate limiting
│   │       └── error_handler.py       # Глобальная обработка ошибок
│   │
│   ├── alembic/                       # Миграции
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── api/v1/
│   │   │   ├── test_auth.py
│   │   │   ├── test_markets.py
│   │   │   └── test_orders.py
│   │   └── services/
│   │       ├── test_polymarket_client.py
│   │       └── test_portfolio_service.py
│   │
│   ├── .env.example
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # Переиспользуемые UI компоненты
│   │   │   │   ├── Button/
│   │   │   │   ├── Table/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Loading/
│   │   │   │   └── Toast/
│   │   │   └── features/             # Функциональные компоненты
│   │   │       ├── Auth/
│   │   │       │   ├── ConnectWallet.tsx
│   │   │       │   └── AuthGuard.tsx
│   │   │       ├── Portfolio/
│   │   │       │   ├── PositionTable.tsx
│   │   │       │   ├── BalanceCard.tsx
│   │   │       │   └── PnLSummary.tsx
│   │   │       ├── Markets/
│   │   │       │   ├── MarketList.tsx
│   │   │       │   ├── MarketCard.tsx
│   │   │       │   ├── MarketSearch.tsx
│   │   │       │   └── OrderBook.tsx
│   │   │       ├── Orders/
│   │   │       │   ├── OrderForm.tsx
│   │   │       │   └── OrderHistory.tsx
│   │   │       ├── Charts/
│   │   │       │   └── PriceChart.tsx
│   │   │       └── Layout/
│   │   │           ├── Sidebar.tsx
│   │   │           ├── Header.tsx
│   │   │           └── AppLayout.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── MarketsPage.tsx
│   │   │   ├── MarketDetailPage.tsx
│   │   │   ├── PortfolioPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWeb3Auth.ts         # MetaMask подключение + JWT
│   │   │   ├── usePolymarketWS.ts     # WebSocket подписки
│   │   │   ├── useMarkets.ts          # React Query + markets API
│   │   │   ├── usePortfolio.ts        # React Query + portfolio API
│   │   │   └── useOrders.ts           # React Query + orders API
│   │   │
│   │   ├── services/
│   │   │   └── api/
│   │   │       ├── client.ts          # Axios instance с JWT interceptor
│   │   │       ├── auth.ts            # Auth API calls
│   │   │       ├── markets.ts         # Markets API calls
│   │   │       ├── portfolio.ts       # Portfolio API calls
│   │   │       └── orders.ts          # Orders API calls
│   │   │
│   │   ├── store/                     # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── portfolioStore.ts
│   │   │   ├── marketStore.ts
│   │   │   └── orderStore.ts
│   │   │
│   │   ├── types/
│   │   │   ├── market.ts
│   │   │   ├── portfolio.ts
│   │   │   ├── order.ts
│   │   │   └── api.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.ts          # Форматирование чисел, дат, адресов
│   │   │   └── validators.ts
│   │   │
│   │   ├── styles/
│   │   │   └── globals.css
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

### 3.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        POLYMARKET APIs                          │
│  Gamma API ──── CLOB API ──── Data API ──── WebSocket Streams   │
└───────┬────────────┬───────────┬──────────────┬─────────────────┘
        │            │           │              │
        ▼            ▼           ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│                                                                 │
│  market_service ◄── polymarket_client ──► order_service          │
│       │              (py-clob-client)          │                 │
│       │                   │                    │                 │
│       ▼                   ▼                    ▼                 │
│  portfolio_service    price_service      ws_relay_service        │
│       │                   │                    │                 │
│       └───────────────────┼────────────────────┘                │
│                           │                                     │
│                     ┌─────▼─────┐                               │
│                     │   Redis   │  (кэш + pub/sub)              │
│                     └─────┬─────┘                               │
│                           │                                     │
│                    ┌──────▼──────┐                               │
│                    │ PostgreSQL  │  (users, orders, snapshots)   │
│                    └─────────────┘                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    REST + WebSocket
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                            │
│                                                                 │
│  Zustand Stores ◄── React Query ◄── API Client (Axios + JWT)   │
│       │                                     │                   │
│       ▼                                     ▼                   │
│  Pages & Components ◄──── WebSocket Hook ──► Real-time Updates  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Модель данных

```sql
-- users: зарегистрированные через MetaMask
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,  -- 0x...
    encrypted_api_key TEXT,          -- зашифрованный Polymarket apiKey
    encrypted_api_secret TEXT,       -- зашифрованный secret
    encrypted_passphrase TEXT,       -- зашифрованный passphrase
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- markets: кэш рынков Polymarket (синхронизируется из Gamma API)
CREATE TABLE markets (
    id VARCHAR(100) PRIMARY KEY,     -- condition_id из Polymarket
    question TEXT NOT NULL,
    slug VARCHAR(255),
    category VARCHAR(100),
    end_date TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    closed BOOLEAN DEFAULT FALSE,
    tokens JSONB,                    -- [{token_id, outcome}]
    volume NUMERIC,
    liquidity NUMERIC,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- price_snapshots: для построения графиков (OHLCV)
CREATE TABLE price_snapshots (
    id BIGSERIAL PRIMARY KEY,
    token_id VARCHAR(100) NOT NULL,
    price NUMERIC(10, 6) NOT NULL,   -- midpoint price
    timestamp TIMESTAMPTZ NOT NULL,
    UNIQUE(token_id, timestamp)
);
CREATE INDEX idx_snapshots_token_ts ON price_snapshots(token_id, timestamp DESC);

-- orders: локальная история ордеров пользователя
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    polymarket_order_id VARCHAR(100),
    market_id VARCHAR(100),
    token_id VARCHAR(100),
    side VARCHAR(4) NOT NULL,        -- 'buy' | 'sell'
    price NUMERIC(10, 6),
    size NUMERIC(18, 6),
    status VARCHAR(20) NOT NULL,     -- pending, live, matched, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Auth Flow

```
1. Frontend: Пользователь кликает "Connect Wallet"
2. Frontend: wagmi/Web3Modal показывает список кошельков
3. Frontend: Пользователь подключает MetaMask
4. Frontend: Запрос GET /api/v1/auth/nonce?wallet={address}
5. Backend:  Генерирует random nonce, сохраняет в Redis (TTL 5 мин)
6. Frontend: MetaMask подписывает nonce (personal_sign)
7. Frontend: POST /api/v1/auth/login { wallet, signature, nonce }
8. Backend:  Верифицирует подпись через eth_account.recover_message()
9. Backend:  Создаёт/находит User в БД
10. Backend: Генерирует JWT (subject=wallet, exp=24h), возвращает клиенту
11. Frontend: Сохраняет JWT в httpOnly cookie / secure localStorage

--- Опционально: привязка Polymarket API credentials ---
12. Frontend: Пользователь вводит свои Polymarket L2 credentials
    (или генерирует через UI: подписывает EIP-712 → backend вызывает CLOB /auth/api-key)
13. Backend: Шифрует credentials (Fernet) и сохраняет в users.encrypted_*
14. Backend: Использует credentials для торговых операций через py-clob-client
```

### 3.5 Кэширование (Redis)

```
Ключ                                          TTL        Описание
─────────────────────────────────────────────────────────────────────
pm:markets:list                               5 мин      Список всех активных рынков
pm:market:{market_id}                         5 мин      Детали рынка
pm:book:{token_id}                            10 сек     Orderbook
pm:price:{token_id}                           10 сек     Текущая цена (midpoint)
pm:portfolio:{wallet}                         2 мин      Позиции пользователя
pm:nonce:{wallet}                             5 мин      Auth nonce (одноразовый)
```

**Redis Pub/Sub каналы:**
```
pm:prices      — обновления цен из Polymarket WebSocket
pm:orders      — обновления статусов ордеров
```

---

## 4. BACKEND DESIGN

### 4.1 Service Layer

**polymarket_client.py** — обёртка над py-clob-client:
- Инициализация ClobClient с L2 credentials пользователя
- Методы: get_markets(), get_orderbook(), create_order(), cancel_order()
- Обработка ошибок API (rate limits, auth errors, network)
- Кэширование read-запросов через Redis

**market_service.py** — работа с рынками:
- Загрузка списка рынков из Gamma API
- Поиск и фильтрация (по категории, статусу, тексту)
- Синхронизация markets в PostgreSQL (фоновая задача)

**portfolio_service.py** — портфель пользователя:
- Загрузка позиций из Data API (`/positions?address=`)
- Расчёт PnL: (current_price - entry_price) * shares
- Расчёт общего баланса и ROI
- Кэширование в Redis (TTL 2 мин)

**order_service.py** — управление ордерами:
- Создание ордера через CLOB API (signed order, EIP-712)
- Отмена ордера
- Получение истории ордеров
- Сохранение в локальную БД

**price_service.py** — ценовые данные:
- Получение текущих цен (midpoint) из CLOB API
- Сохранение price snapshots в PostgreSQL (каждые 60 сек)
- Агрегация snapshots в OHLCV данные (1m, 5m, 1h, 1d)
- Примечание: Polymarket не предоставляет готовые OHLCV — строим из snapshots

**ws_relay_service.py** — WebSocket relay:
- Подключение к Polymarket WS (`wss://ws-subscriptions-clob.polymarket.com/ws/`)
- Парсинг trade/price events
- Публикация в Redis pub/sub
- FastAPI WebSocket endpoint подписывается на Redis и пушит клиентам

**scheduler_service.py** — фоновые задачи (APScheduler):
```
sync_markets         каждые 10 мин    Синхронизация рынков из Gamma API → PostgreSQL
snapshot_prices      каждые 60 сек    Сохранение midpoint prices → price_snapshots
sync_portfolios      каждые 5 мин     Обновление кэша портфелей активных пользователей
cleanup_nonces       каждые 10 мин    Удаление expired nonces из Redis
```

### 4.2 Наш REST API (Backend → Frontend)

```
Auth:
  GET  /api/v1/auth/nonce?wallet={addr}      → { nonce, message }
  POST /api/v1/auth/login                     → { access_token }
  POST /api/v1/auth/polymarket-creds          → { status }  (сохранить API creds)

Markets:
  GET  /api/v1/markets                        → { markets[], total, page }
  GET  /api/v1/markets/{id}                   → { market, orderbook, price }
  GET  /api/v1/markets/search?q={query}       → { markets[] }

Portfolio:
  GET  /api/v1/portfolio                      → { positions[], balance, pnl }
  GET  /api/v1/portfolio/history              → { snapshots[] }

Orders:
  POST /api/v1/orders                         → { order }
  DELETE /api/v1/orders/{id}                  → { status }
  GET  /api/v1/orders                         → { orders[], total }
  GET  /api/v1/orders/{id}                    → { order }

Charts:
  GET  /api/v1/charts/{token_id}?tf=1h&limit=100  → { ohlcv[] }
  GET  /api/v1/charts/{token_id}/price             → { price, timestamp }

WebSocket:
  WS   /api/v1/ws                             → real-time prices, order updates
```

---

## 5. FRONTEND DESIGN

### 5.1 Страницы

| Страница | URL | Описание |
|----------|-----|----------|
| Auth | `/` | Подключение MetaMask, начальная страница |
| Dashboard | `/dashboard` | Обзор: баланс, последние позиции, активные рынки |
| Markets | `/markets` | Список рынков с поиском и фильтрацией |
| Market Detail | `/markets/:id` | График, orderbook, кнопки Buy/Sell |
| Portfolio | `/portfolio` | Таблица позиций, PnL, баланс |
| Orders | `/orders` | История ордеров, отмена активных |
| Settings | `/settings` | Привязка Polymarket API creds, тема, уведомления |

### 5.2 State Management (Zustand)

**authStore:**
- `wallet: string | null` — адрес подключённого кошелька
- `jwt: string | null` — JWT токен
- `isConnected: boolean`
- `hasPolymarketCreds: boolean` — привязаны ли L2 credentials
- `connect()`, `disconnect()`, `login()`

**marketStore:**
- `markets: Market[]`
- `selectedMarket: Market | null`
- `filters: { category, status, query }`
- `fetchMarkets()`, `searchMarkets()`

**portfolioStore:**
- `positions: Position[]`
- `balance: number`
- `totalPnl: number`
- `fetchPortfolio()`

**orderStore:**
- `orders: Order[]`
- `createOrder()`, `cancelOrder()`, `fetchOrders()`

### 5.3 React Query

Все API вызовы через `@tanstack/react-query`:
- `useQuery` для GET запросов с автоматическим кэшированием и refetch
- `useMutation` для POST/DELETE с optimistic updates
- `staleTime`: 30 сек для markets, 10 сек для prices, 2 мин для portfolio
- WebSocket обновления инвалидируют кэш React Query

### 5.4 Ключевые компоненты

**PriceChart** — TradingView Lightweight Charts:
- OHLCV candlestick + volume
- Timeframes: 1m, 5m, 15m, 1h, 4h, 1d
- Real-time обновление через WebSocket

**OrderBook** — отображение bid/ask:
- Цена, размер, совокупный объём
- Live обновления

**OrderForm** — создание ордера:
- Выбор стороны (Buy/Sell)
- Ввод цены и количества
- Превью: total cost, estimated return
- MetaMask подтверждение (если нет сохранённых L2 creds)

**PositionTable** — таблица позиций:
- Market, shares, entry price, current price, PnL ($ и %)
- Сортировка, фильтрация
- Клик → переход на Market Detail

---

## 6. MVP ПЛАН

### Фаза 1: Foundation
- [ ] Инициализация git репозитория
- [ ] Docker Compose: PostgreSQL 16, Redis 7, backend (Python 3.12), frontend (Node 20)
- [ ] Backend скелет: FastAPI + lifespan, config, DB session, health check
- [ ] Frontend скелет: Vite + React 19 + TypeScript + TailwindCSS + React Router
- [ ] Alembic setup + первая миграция (users table)
- [ ] Web3 Auth: MetaMask подключение (wagmi v2), nonce → sign → JWT
- [ ] Layout: Sidebar, Header, AppLayout, routing

### Фаза 2: Market Data
- [ ] `market_service.py`: загрузка рынков из Gamma API
- [ ] `polymarket_client.py`: обёртка над py-clob-client (read operations)
- [ ] Redis кэширование markets (TTL 5 мин)
- [ ] REST: GET /markets, GET /markets/{id}, GET /markets/search
- [ ] Frontend: MarketsPage, MarketList, MarketCard, MarketSearch
- [ ] Фоновая задача: sync_markets (APScheduler, каждые 10 мин)

### Фаза 3: Portfolio
- [ ] `portfolio_service.py`: позиции из Data API, расчёт PnL
- [ ] REST: GET /portfolio
- [ ] Frontend: PortfolioPage, PositionTable, BalanceCard, PnLSummary
- [ ] Dashboard: обзорная страница с ключевыми метриками

### Фаза 4: Trading
- [ ] Привязка Polymarket L2 credentials (шифрование Fernet)
- [ ] `order_service.py`: создание/отмена ордеров через CLOB API
- [ ] Миграция: orders table
- [ ] REST: POST /orders, DELETE /orders/{id}, GET /orders
- [ ] Frontend: MarketDetailPage, OrderForm, OrderBook, OrderHistory
- [ ] Settings: страница привязки API credentials

### Фаза 5: Charts & Analytics
- [ ] `price_service.py`: midpoint snapshots каждые 60 сек
- [ ] Миграция: price_snapshots table
- [ ] REST: GET /charts/{token_id} (OHLCV агрегация из snapshots)
- [ ] Frontend: PriceChart (TradingView Lightweight Charts)
- [ ] Timeframes: 1m, 5m, 1h, 1d

### Фаза 6: WebSocket & Real-time
- [ ] `ws_relay_service.py`: подключение к Polymarket WS
- [ ] Redis pub/sub relay
- [ ] FastAPI WebSocket endpoint (/api/v1/ws)
- [ ] Frontend: usePolymarketWS hook
- [ ] Live обновления цен в MarketList, PriceChart, OrderBook

### Фаза 7: Polish & Deploy
- [ ] UI/UX: responsive design, dark theme, loading states, error states
- [ ] Тесты: минимум 80% покрытия critical paths (auth, orders, portfolio)
- [ ] OpenAPI документация (автогенерация FastAPI)
- [ ] Docker production compose (Nginx reverse proxy, SSL)
- [ ] CI/CD: GitHub Actions (lint, test, build, deploy)

---

## 7. ЗАВИСИМОСТИ

### Python Requirements (Backend)

```
# Core Framework
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.10.0
pydantic-settings>=2.6.0

# Database
sqlalchemy[asyncio]>=2.0.36
alembic>=1.14.0
asyncpg>=0.30.0                     # async PostgreSQL driver

# Redis
redis[hiredis]>=5.2.0               # async support через redis.asyncio

# Polymarket
py-clob-client>=0.18.0              # Официальный SDK

# Web3 & Cryptography
eth-account>=0.13.0
eth-utils>=5.1.0

# Security & Auth
PyJWT>=2.10.0                       # JWT (вместо python-jose)
cryptography>=44.0.0                # Fernet шифрование API creds
python-multipart>=0.0.18

# Async HTTP
httpx>=0.28.0                       # async HTTP client

# Background Tasks
APScheduler>=3.10.4

# Data
python-dateutil>=2.9.0

# Testing
pytest>=8.3.0
pytest-asyncio>=0.24.0
pytest-cov>=6.0.0
httpx>=0.28.0                       # TestClient

# Monitoring & Logging
python-json-logger>=3.2.0
sentry-sdk[fastapi]>=2.19.0

# Development
ruff>=0.8.0                         # linter + formatter (замена black, isort, flake8)
mypy>=1.13.0
```

### NPM Dependencies (Frontend)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",

    "@tanstack/react-query": "^5.62.0",
    "axios": "^1.7.0",
    "zustand": "^5.0.0",

    "wagmi": "^2.14.0",
    "viem": "^2.21.0",
    "@web3modal/wagmi": "^5.1.0",

    "lightweight-charts": "^4.2.0",
    "@tanstack/react-table": "^8.20.0",

    "tailwindcss": "^4.0.0",
    "clsx": "^2.1.0",
    "date-fns": "^4.1.0",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.7.0",

    "vitest": "^2.1.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",

    "eslint": "^9.16.0",
    "@typescript-eslint/eslint-plugin": "^8.18.0",
    "@typescript-eslint/parser": "^8.18.0"
  }
}
```

---

## 8. SECURITY CHECKLIST

### Общее
- [ ] HTTPS only в продакшене
- [ ] CORS: только доверенные домены (frontend URL)
- [ ] Rate limiting: 100 req/min по IP, 500 по wallet
- [ ] Input validation: все входные данные через Pydantic схемы
- [ ] SQL Injection: только ORM запросы (SQLAlchemy), никакого raw SQL
- [ ] XSS: CSP headers, санитизация user input
- [ ] Логирование всех торговых операций (audit trail)

### Web3 & Credentials
- [ ] Приватные ключи НИКОГДА не передаются и не хранятся на сервере
- [ ] Polymarket API credentials шифруются Fernet перед сохранением в БД
- [ ] Ключ шифрования хранится в переменной окружения, не в коде
- [ ] MetaMask подпись верифицируется на backend (eth_account)
- [ ] JWT: httpOnly cookie или secure localStorage, exp 24h
- [ ] Nonce одноразовый, TTL 5 мин в Redis

### Инфраструктура
- [ ] .env файлы в .gitignore
- [ ] Docker: non-root пользователь в контейнерах
- [ ] Секреты через переменные окружения, не хардкод
- [ ] Зависимости: регулярное обновление, аудит уязвимостей

---

## 9. POST-MVP ROADMAP

### Stop-Loss / Take-Profit (v2)
- Фоновый мониторинг цен (APScheduler или Celery, каждые 10 сек)
- Модель StopLossRule (position_id, stop_price, take_profit_price, status)
- Автоматическое создание market order при срабатывании
- История срабатываний
- Уведомления через WebSocket

### Продвинутая аналитика (v2)
- Технические индикаторы: MA(20, 50), RSI, MACD
- Multi-market сравнение на одном графике
- Рисование трендлайнов, support/resistance
- Export данных в CSV
- Portfolio performance over time (drawdown, Sharpe ratio)

### Уведомления (v2)
- Telegram бот: алерты по ценам, ордерам, PnL
- Email уведомления
- Push-уведомления в браузере

### Расширения (v3)
- Multi-wallet поддержка (несколько кошельков на аккаунт)
- Leaderboard (топ трейдеры по PnL)
- Социальный трейдинг (копирование позиций)
- Мобильная версия (PWA)

---

## 10. РЕКОМЕНДУЕМЫЕ MCP СЕРВЕРЫ

### Для тестирования
- **Playwright MCP** (`@playwright/mcp`) — E2E тесты UI: торговые flow, подключение кошелька, создание ордеров. Работает через accessibility tree. Docker: `mcr.microsoft.com/playwright/mcp`
- **Postgres MCP Pro** — SQL explain plans, health checks, отладка запросов. Подключение через DATABASE_URI

### Для визуальной отладки
- **Claude in Chrome** — скриншоты, accessibility tree, навигация, формы, консоль, сетевые запросы. Визуальная проверка UI прямо в браузере

### Для разработки
- **Context7** — актуальная документация фреймворков (React, FastAPI, wagmi)
- **GitHub MCP** — issues, PR, CI/CD

Рекомендация: подключать не более 2-3 MCP одновременно.

---

## 11. ПОЛЕЗНЫЕ ССЫЛКИ

**Polymarket:**
- Документация: https://docs.polymarket.com
- CLOB API: https://docs.polymarket.com/developers/CLOB/introduction
- Gamma API: https://docs.polymarket.com/developers/gamma-markets-api/overview
- Auth: https://docs.polymarket.com/developers/CLOB/authentication
- WebSocket: https://docs.polymarket.com/developers/CLOB/websocket/wss-overview
- py-clob-client: https://github.com/Polymarket/py-clob-client

**Фреймворки:**
- FastAPI: https://fastapi.tiangolo.com
- React 19: https://react.dev
- wagmi v2: https://wagmi.sh
- TailwindCSS v4: https://tailwindcss.com
- TradingView Lightweight Charts: https://tradingview.github.io/lightweight-charts/

**Тестирование:**
- pytest: https://docs.pytest.org
- Vitest: https://vitest.dev
- React Testing Library: https://testing-library.com
