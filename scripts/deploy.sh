#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────
# Polymarket Cabinet - VPS Deploy Script
# ──────────────────────────────────────────
#
# Usage:
#   First time setup:  ./scripts/deploy.sh setup
#   Deploy update:     ./scripts/deploy.sh deploy
#   View logs:         ./scripts/deploy.sh logs
#   Restart:           ./scripts/deploy.sh restart
#   Status:            ./scripts/deploy.sh status
#

COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

case "${1:-help}" in

  setup)
    echo "=== Initial Server Setup ==="

    # Check .env exists
    if [ ! -f .env ]; then
      echo "ERROR: .env file not found!"
      echo "Copy .env.example and fill in production values:"
      echo "  cp backend/.env.example .env"
      exit 1
    fi

    # Build and start all services
    docker compose -f "$COMPOSE_FILE" build
    docker compose -f "$COMPOSE_FILE" up -d

    # Wait for DB to be ready
    echo "Waiting for database..."
    sleep 5

    # Run migrations
    docker compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head

    echo "=== Setup Complete ==="
    echo "Application is running at http://$(hostname -I | awk '{print $1}')"
    docker compose -f "$COMPOSE_FILE" ps
    ;;

  deploy)
    echo "=== Deploying Update ==="

    # Pull latest code
    git pull origin main

    # Rebuild images
    docker compose -f "$COMPOSE_FILE" build

    # Rolling restart (zero downtime for stateless services)
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

    # Run migrations
    docker compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head

    # Cleanup
    docker image prune -f

    echo "=== Deploy Complete ==="
    docker compose -f "$COMPOSE_FILE" ps
    ;;

  logs)
    SERVICE="${2:-}"
    if [ -n "$SERVICE" ]; then
      docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
    else
      docker compose -f "$COMPOSE_FILE" logs -f
    fi
    ;;

  restart)
    echo "=== Restarting Services ==="
    docker compose -f "$COMPOSE_FILE" restart
    docker compose -f "$COMPOSE_FILE" ps
    ;;

  stop)
    echo "=== Stopping Services ==="
    docker compose -f "$COMPOSE_FILE" down
    ;;

  status)
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "--- Health Checks ---"
    curl -sf http://localhost/health 2>/dev/null && echo "" || echo "Backend: unreachable"
    ;;

  migrate)
    echo "=== Running Migrations ==="
    docker compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head
    ;;

  help|*)
    echo "Polymarket Cabinet Deploy Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  setup    - First time setup (build, start, migrate)"
    echo "  deploy   - Pull, rebuild, restart, migrate"
    echo "  logs     - View logs (optional: logs <service>)"
    echo "  restart  - Restart all services"
    echo "  stop     - Stop all services"
    echo "  status   - Show service status"
    echo "  migrate  - Run database migrations"
    ;;
esac
