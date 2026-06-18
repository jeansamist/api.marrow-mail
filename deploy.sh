#!/bin/bash
set -euo pipefail

# ---------------------------------------------------------------------------
# deploy.sh — build, run, and wire up Nginx for api.marrow-mail
#
# Usage:
#   ./deploy.sh <domain> <host-port> [env-file]
#
# Examples:
#   ./deploy.sh api.marrow-mail.com 3333
#   ./deploy.sh api.marrow-mail.com 3333 /path/to/.env.production
# ---------------------------------------------------------------------------

# ── colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}▶${NC} $*"; }
info() { echo -e "${CYAN}ℹ${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
die()  { echo -e "${RED}✖${NC}  $*" >&2; exit 1; }

# ── args ───────────────────────────────────────────────────────────────────
DOMAIN="${1:-}"
HOST_PORT="${2:-}"
ENV_FILE="${3:-.env}"

[[ -n "$DOMAIN" ]]    || die "Usage: $0 <domain> <host-port> [env-file]"
[[ -n "$HOST_PORT" ]] || die "Usage: $0 <domain> <host-port> [env-file]"
[[ "$HOST_PORT" =~ ^[0-9]+$ ]] || die "host-port must be a number"
[[ -f "$ENV_FILE" ]] || die ".env file not found: $ENV_FILE"

# ── config ─────────────────────────────────────────────────────────────────
IMAGE_NAME="marrow-mail-api"
CONTAINER_NAME="marrow-mail-api"
APP_PORT="3333"           # port the app listens on inside the container

NGINX_AVAILABLE="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"

# ── pre-flight ─────────────────────────────────────────────────────────────
command -v docker &>/dev/null || die "docker is not installed"

# ── 1. build ───────────────────────────────────────────────────────────────
log "Building Docker image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" "$(dirname "$0")"

# ── 2. swap container ──────────────────────────────────────────────────────
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log "Removing existing container: $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME"
fi

log "Starting container: $CONTAINER_NAME  (127.0.0.1:$HOST_PORT → container:$APP_PORT)"
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p "127.0.0.1:${HOST_PORT}:${APP_PORT}" \
  "$IMAGE_NAME"

# ── 3. nginx ───────────────────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  warn "nginx not found — skipping reverse-proxy setup"
else
  if [[ -f "$NGINX_AVAILABLE" ]]; then
    warn "Nginx config already exists at $NGINX_AVAILABLE — skipping"
  else
    log "Writing Nginx config: $NGINX_AVAILABLE"
    sudo tee "$NGINX_AVAILABLE" > /dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # recommended buffer / timeout tweaks for an API
    client_max_body_size 20M;
    proxy_read_timeout   120s;
    proxy_send_timeout   120s;

    location / {
        proxy_pass         http://127.0.0.1:$HOST_PORT;
        proxy_http_version 1.1;

        proxy_set_header   Upgrade            \$http_upgrade;
        proxy_set_header   Connection         'upgrade';
        proxy_set_header   Host               \$host;
        proxy_set_header   X-Real-IP          \$remote_addr;
        proxy_set_header   X-Forwarded-For    \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto  \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

    sudo ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"

    if sudo nginx -t 2>/dev/null; then
      sudo systemctl reload nginx
      log "Nginx reloaded"
    else
      die "Nginx config test failed — check $NGINX_AVAILABLE"
    fi

    info "HTTP is live at http://$DOMAIN"
    info "To add TLS: sudo certbot --nginx -d $DOMAIN"
  fi
fi

# ── done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✔ Deployment complete${NC}"
echo -e "  Container : ${CYAN}$CONTAINER_NAME${NC}"
echo -e "  Image     : ${CYAN}$IMAGE_NAME${NC}"
echo -e "  Binding   : ${CYAN}127.0.0.1:$HOST_PORT${NC} → container:$APP_PORT"
echo -e "  Env file  : ${CYAN}$ENV_FILE${NC}"
[[ -f "$NGINX_AVAILABLE" ]] && echo -e "  Domain    : ${CYAN}http://$DOMAIN${NC}"
