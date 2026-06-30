#!/usr/bin/env bash
# Set Hunter.io + Apollo keys on Render production (and optionally local backend/.env).
#
# Get keys:
#   Hunter — https://hunter.io/api-keys (free tier: 25 searches/mo)
#   Apollo — https://app.apollo.io/#/settings/integrations/api (free tier limited)
#
# Usage (production):
#   HUNTER_API_KEY='...' APOLLO_API_KEY='...' RENDER_API_KEY='rnd_...' ./scripts/configure-recruiter-enrichment.sh
#
# Usage (local only — skips Render):
#   HUNTER_API_KEY='...' APOLLO_API_KEY='...' LOCAL_ONLY=1 ./scripts/configure-recruiter-enrichment.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
RENDER_SERVICE_NAME="${RENDER_SERVICE_NAME:-remotematch}"

upsert_render_env() {
  local service_id="$1"
  local key="$2"
  local value="$3"
  curl -sf -X PUT \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"value\":$(node -e "console.log(JSON.stringify(process.argv[1]))" "$value")}" \
    "https://api.render.com/v1/services/${service_id}/env-vars/${key}" > /dev/null
}

upsert_local_env() {
  local key="$1"
  local value="$2"
  touch "$ENV_FILE"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    node -e "
const fs = require('fs');
const key = process.argv[1];
const value = process.argv[2];
const path = process.argv[3];
let text = fs.readFileSync(path, 'utf8');
const line = key + '=' + value;
text = text.replace(new RegExp('^' + key + '=.*$', 'm'), line);
if (!new RegExp('^' + key + '=', 'm').test(text)) text += (text.endsWith('\n') ? '' : '\n') + line + '\n';
fs.writeFileSync(path, text);
" "$key" "$value" "$ENV_FILE"
  else
    printf '\n# Recruiter contact enrichment\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

if [[ -z "${HUNTER_API_KEY:-}" && -z "${APOLLO_API_KEY:-}" ]]; then
  echo "Error: set at least one of HUNTER_API_KEY or APOLLO_API_KEY"
  exit 1
fi

if [[ -n "${HUNTER_API_KEY:-}" ]]; then
  upsert_local_env "HUNTER_API_KEY" "$HUNTER_API_KEY"
  echo "  HUNTER_API_KEY → backend/.env"
fi

if [[ -n "${APOLLO_API_KEY:-}" ]]; then
  upsert_local_env "APOLLO_API_KEY" "$APOLLO_API_KEY"
  echo "  APOLLO_API_KEY → backend/.env"
fi

if [[ "${LOCAL_ONLY:-}" == "1" ]]; then
  echo "LOCAL_ONLY=1 — skipping Render. Run: ./scripts/test-recruiter-keys.sh"
  exit 0
fi

if [[ -z "${RENDER_API_KEY:-}" ]]; then
  echo ""
  echo "No RENDER_API_KEY — local .env updated only."
  echo "For production, re-run with RENDER_API_KEY from Render → Account Settings → API Keys"
  exit 0
fi

SERVICE_ID=$(curl -sf -H "Authorization: Bearer ${RENDER_API_KEY}" \
  "https://api.render.com/v1/services?limit=50" | node -e "
const data = JSON.parse(require('fs').readFileSync(0,'utf8'));
const svc = (Array.isArray(data) ? data : []).find((s) => s.service?.name === process.argv[1]);
if (!svc) process.exit(1);
console.log(svc.service.id);
" "$RENDER_SERVICE_NAME")

echo "Updating Render service ${RENDER_SERVICE_NAME} (${SERVICE_ID})..."

if [[ -n "${HUNTER_API_KEY:-}" ]]; then
  upsert_render_env "$SERVICE_ID" "HUNTER_API_KEY" "$HUNTER_API_KEY"
  echo "  HUNTER_API_KEY set on Render"
fi

if [[ -n "${APOLLO_API_KEY:-}" ]]; then
  upsert_render_env "$SERVICE_ID" "APOLLO_API_KEY" "$APOLLO_API_KEY"
  echo "  APOLLO_API_KEY set on Render"
fi

curl -sf -X POST \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "https://api.render.com/v1/services/${SERVICE_ID}/deploys" > /dev/null || true

echo ""
echo "Deploy triggered. After ~2 min check:"
echo "  curl -s https://remotelymatch.app/api/health | node -e \"const d=JSON.parse(require('fs').readFileSync(0)); console.log('hunter:', d.hunterConfigured, 'apollo:', d.apolloConfigured)\""
