# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-user Polymarket personal cabinet — portfolio management and trading for Polymarket prediction markets. Backend: FastAPI + SQLAlchemy 2.0 async + PostgreSQL + Redis. Frontend: React 19 + wagmi v2 + Zustand v5 + TailwindCSS v4. Auth: MetaMask → nonce → personal_sign → JWT + Fernet-encrypted Polymarket L2 credentials.

## Commands

### Development (Docker Compose — primary workflow)
```bash
docker compose up --build              # All 4 services: backend:8000, frontend:3000, db:5432, redis:6379
docker compose up --build backend      # Rebuild backend only (required after adding migrations)
docker compose logs -f backend         # Follow backend logs
```

### Backend lint/test (local or CI)
```bash
cd backend
ruff check app/                                       # Lint
mypy app/ --ignore-missing-imports                    # Type check
pytest --cov=app --cov-report=term-missing -v         # Tests (needs Postgres + Redis running)
pytest tests/test_specific.py -v                      # Single test file
pytest tests/test_specific.py::test_function -v       # Single test
```

### Frontend lint/test/build
```bash
cd frontend
npm run dev           # Vite dev server
npm run build         # tsc -b && vite build
npm run lint          # ESLint
npm run test          # Vitest
npm run test:ui       # Vitest UI
```

### Alembic migrations (inside container)
```bash
docker compose exec backend alembic revision --autogenerate -m "description"
docker compose exec backend alembic upgrade head
# IMPORTANT: After creating migration files, rebuild: docker compose build backend
# Volume mount ./backend/app:/app/app does NOT include alembic/
```

## Architecture

### Auth Flow
1. `GET /api/v1/auth/nonce?wallet={addr}` → nonce in Redis (5 min TTL)
2. MetaMask signs nonce message → `POST /api/v1/auth/login` → JWT (24h HS256)
3. JWT in `localStorage`, attached via Axios interceptor as `Authorization: Bearer`
4. Private key stored via `POST /api/v1/auth/private-key` → auto-derives CLOB API creds → all Fernet-encrypted in DB

### Backend Layering
`endpoints/` → `services/` → `crud/` → `models/`. Dependencies via `Depends(get_db)` and `Depends(get_current_user)`. In scheduler jobs, use `async with async_session_maker() as db:` directly.

### API Routes
- Auth: `/api/v1/auth/{nonce,login,me,polymarket-creds,proxy-wallet,private-key}`
- Markets: `/api/v1/markets`, `/markets/search`, `/markets/{id}`
- Portfolio: `/api/v1/portfolio`, `/portfolio/sync`
- Orders: `/api/v1/orders`, `/orders/sync`
- Trading: `/api/v1/trading/{market-sell,take-profit,stop-loss,orders/{id}}`

### Frontend Structure
- Pages: `AuthPage`, `DashboardPage`, `MarketsPage`, `MarketDetailPage`, `PortfolioPage`, `OrdersPage`, `SettingsPage`
- State: Zustand `authStore` (wallet, jwt, creds flags) + React Query for server state
- `AuthGuard` wraps protected routes, redirects to `/` if no JWT
- Vite proxies `/api/*` to backend (`PROXY_TARGET` env var, defaults to `http://localhost:8000`)
- Import alias: `@/` → `./src/`

### Polymarket Proxy Wallet Architecture
- Polymarket deploys a 1-of-1 Safe multisig proxy on Polygon per user
- Positions & USDC live on the proxy wallet, NOT the EOA
- Cannot derive proxy wallet from EOA — user must supply it via Settings
- `User.portfolio_wallet` returns `proxy_wallet or wallet_address`

### Polymarket API IDs (critical)
- **Gamma API** uses numeric `id` for markets
- **Data API** uses `conditionId` (0x-hash) — different system
- Positions table has NO FK to markets table because of this mismatch

### Background Jobs (APScheduler)
- Market sync from Gamma API: every 10 minutes
- Stop-loss monitoring: every 30 seconds

### Redis Cache Keys
- `pm:nonce:{wallet}` (5 min), `pm:markets:list:{...}` (5 min), `pm:market:{id}` (5 min)
- `pm:portfolio:{wallet}` (2 min), `pm:book:{token_id}` (10 sec), `pm:price:{token_id}` (10 sec)

## Key Gotchas

- `AsyncSession.delete()` is synchronous — call `db.delete(obj)` without `await`
- `QueuePool` cannot be used with async engine — omit `poolclass` (uses `AsyncAdaptedQueuePool`)
- Fernet key must be valid base64-encoded 32 bytes — use `Fernet.generate_key()`
- Node Alpine Dockerfile needs `python3 make g++` for native modules (wagmi → bufferutil)
- `create_all()` in dev lifespan makes `alembic --autogenerate` produce empty migrations — use `alembic stamp`
- Polymarket image URLs exceed 500 chars — use `Text` not `String(500)`
- Semaphores in `polymarket_client.py`: Gamma=15 concurrent, CLOB=2 concurrent
- `ClobClient` funder param MUST be `proxy_wallet`, not EOA; `signature_type=2` (POLY_PROXY)

## Coding Conventions

### Backend (Python 3.12+)
- ruff: `line-length = 100`, rules `E,F,I,N,W,UP,B,A,SIM` (E501 ignored)
- mypy: `strict = true`, `ignore_missing_imports = true`
- pytest: `asyncio_mode = "auto"`
- snake_case everywhere, async/await for all DB and HTTP operations

### Frontend (TypeScript strict)
- `noUnusedLocals: true`, `noUnusedParameters: true`
- TailwindCSS v4: `@import "tailwindcss"` (no `@tailwind` directives), `@tailwindcss/vite` plugin
- Dark-only theme via CSS custom properties in `globals.css`
- camelCase for functions/variables, PascalCase for components/types

### Mandatory Coding Rules
The `python_fastapi_ts_rules/` directory contains 24 rule files. Key ones:
- `09_python_async.md` — async patterns, semaphores, no blocking event loop
- `10_fastapi_structure.md` — lifespan, config, deps, CRUD/services layering
- `14_fastapi_database.md` — async SQLAlchemy, Alembic migrations
- `23_react_frontend.md` — React 19 patterns, Zustand, component architecture

## CI/CD

GitHub Actions on push to `main`/`develop` and PRs to `main`:
- Backend: ruff check, mypy, pytest (with Postgres + Redis services)
- Frontend: npm lint, npm build
- Deploy: SSH to VPS → `docker compose -f docker-compose.prod.yml build && up -d` → `alembic upgrade head`

## py-clob-client Usage
```python
client = ClobClient(
    host=settings.POLYMARKET_CLOB_API,
    chain_id=137,            # Polygon
    key=private_key,         # hex without 0x prefix
    creds=ApiCreds(api_key, api_secret, api_passphrase),
    signature_type=2,        # POLY_PROXY for proxy wallet users
    funder=user.proxy_wallet # MUST be proxy wallet
)
```
