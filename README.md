# Polymarket Cabinet

Personal cabinet for Polymarket portfolio management and trading.

**Stack:** FastAPI + SQLAlchemy 2.0 async + PostgreSQL + Redis | React 19 + wagmi v2 + Zustand + TailwindCSS v4

## Server Requirements

- VPS with 1+ GB RAM, Ubuntu 22.04+ or Debian 12+
- Docker Engine 24+ and Docker Compose v2
- Server must be located in a **region allowed by Polymarket** (US, UK, EU etc.) — trading API calls from restricted countries return 403

## Initial Server Setup

### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (re-login after this)
sudo usermod -aG docker $USER
```

### 2. Clone the Repository

```bash
cd /opt
git clone https://github.com/serj8772/polymarket-cabinet.git polymarket
cd polymarket
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in the values:

| Variable | How to generate |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -hex 16` |
| `SECRET_KEY` | `openssl rand -hex 32` |
| `FERNET_KEY` | `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `ALLOWED_ORIGINS` | `["http://YOUR_SERVER_IP"]` or `["https://your-domain.com"]` |
| `DATABASE_URL` | Replace `CHANGE_ME` with the same password as `POSTGRES_PASSWORD` |

Example `.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:mypassword123@db:5432/polymarket
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mypassword123
POSTGRES_DB=polymarket
REDIS_URL=redis://redis:6379/0
SECRET_KEY=a1b2c3...64-hex-chars
FERNET_KEY=base64-encoded-key-from-Fernet
ALLOWED_ORIGINS=["http://123.45.67.89"]
LOG_LEVEL=INFO
```

### 4. Log in to GitHub Container Registry

Docker images are pre-built in CI and hosted on GHCR. You need a GitHub Personal Access Token (PAT) with `read:packages` scope.

```bash
# Create a token at: https://github.com/settings/tokens
# Select scope: read:packages

echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 5. Start the Application

```bash
# First-time setup: pull images, start services, run migrations
./scripts/deploy.sh setup
```

The app will be available at `http://YOUR_SERVER_IP`.

### 6. Verify

```bash
# Check all services are running
./scripts/deploy.sh status

# Check backend health
curl http://localhost/health

# View logs
./scripts/deploy.sh logs
./scripts/deploy.sh logs backend   # backend only
```

## Setting Up Automatic Deploys (CI/CD)

Pushes to `main` trigger automatic deployment via GitHub Actions. To enable this:

### GitHub Repository Secrets

Go to **Settings > Secrets and variables > Actions** and add:

| Secret | Value |
|---|---|
| `VPS_HOST` | Your server IP address |
| `VPS_USER` | SSH username (e.g. `root`) |
| `VPS_SSH_KEY` | Private SSH key (see below) |
| `VPS_PORT` | SSH port (default: `22`) |
| `DEPLOY_PATH` | Path to the project on VPS (default: `/opt/polymarket`) |

### Generate SSH Key on the Server

```bash
# On the VPS:
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""

# Add to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Copy the PRIVATE key — paste it into the VPS_SSH_KEY GitHub secret
cat ~/.ssh/github_deploy
```

## Usage

### Connect Wallet

1. Open `http://YOUR_SERVER_IP` in a browser with MetaMask
2. Click **Connect Wallet** and sign the nonce message
3. Go to **Settings** and enter your Polymarket **proxy wallet** address
4. Enter your **private key** — it will be encrypted and stored server-side. API credentials are derived automatically

### Features

- **Portfolio** — syncs positions from Polymarket, shows PnL
- **Markets** — browse and search active prediction markets
- **Trading** — take profit (GTC limit order on CLOB) and stop loss (server-side monitoring every 30s, auto-sells when triggered)
- **Orders** — view and manage active orders

## Management Commands

```bash
cd /opt/polymarket

./scripts/deploy.sh setup      # First-time setup
./scripts/deploy.sh deploy     # Pull latest & redeploy
./scripts/deploy.sh logs       # View all logs
./scripts/deploy.sh logs backend  # Backend logs only
./scripts/deploy.sh restart    # Restart services
./scripts/deploy.sh stop       # Stop all services
./scripts/deploy.sh status     # Service status
./scripts/deploy.sh migrate    # Run DB migrations manually
```

## Architecture

```
                    ┌──────────┐
                    │  Nginx   │ :80/:443
                    └────┬─────┘
                   /api/  │  /*
            ┌─────────┐  ┌──────────┐
            │ Backend  │  │ Frontend │
            │ FastAPI  │  │  React   │
            └────┬─────┘  └──────────┘
           ┌─────┴─────┐
      ┌────┴───┐  ┌────┴───┐
      │Postgres│  │ Redis  │
      └────────┘  └────────┘
```

- **Nginx** — reverse proxy, routes `/api/*` to backend, everything else to frontend
- **Backend** — FastAPI + Uvicorn, 2 workers, background scheduler (APScheduler)
- **Frontend** — React SPA served by internal Nginx
- **PostgreSQL** — users, positions, orders, markets
- **Redis** — nonce TTL, market/price cache

## Local Development

```bash
# Start all services with hot-reload
docker compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

## Troubleshooting

**500 on wallet connect** — check backend logs: `./scripts/deploy.sh logs backend`. Usually a missing DB migration — run `./scripts/deploy.sh migrate`.

**Stop loss / take profit fails** — check that private key and proxy wallet are configured in Settings. Check backend logs for 403 errors — this means the server is in a Polymarket-restricted region.

**Frontend shows blank page** — check that `ALLOWED_ORIGINS` in `.env` includes your server's URL. Restart after changing: `./scripts/deploy.sh restart`.

**Database connection errors after migration** — restart backend to clear connection pool cache: `docker compose -f docker-compose.prod.yml restart backend`.
