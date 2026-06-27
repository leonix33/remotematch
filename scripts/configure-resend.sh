#!/usr/bin/env bash
# Configure Resend for remotelymatch (local .env + optional Render production).
#
# Usage:
#   RESEND_API_KEY='re_...' ./scripts/configure-resend.sh
# Or interactive:
#   ./scripts/configure-resend.sh
#
# With Render API (updates production env):
#   RESEND_API_KEY='re_...' RENDER_API_KEY='rnd_...' ./scripts/configure-resend.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"
RENDER_SERVICE_NAME="remotematch"

# Sandbox sender — only delivers to your Resend account email until a domain is verified.
EMAIL_FROM="${EMAIL_FROM:-remotelymatch <noreply@remotelymatch.app>}"

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "Paste your Resend API key (starts with re_):"
  echo "  Get one at: https://resend.com/api-keys"
  read -rs RESEND_API_KEY
  echo ""
fi

if [[ -z "$RESEND_API_KEY" || "$RESEND_API_KEY" != re_* ]]; then
  echo "Error: RESEND_API_KEY must start with re_"
  exit 1
fi

echo "Testing Resend API..."
TEST_RESULT=$(node -e "
fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + process.argv[1],
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: process.argv[2],
    to: [process.argv[3]],
    subject: 'remotelymatch — Resend connected',
    html: '<p>Resend is configured for remotelymatch. Team invites and password resets will work.</p>',
  }),
})
  .then(async (res) => {
    const text = await res.text();
    if (!res.ok) {
      console.error('FAIL:' + text);
      process.exit(1);
    }
    console.log('OK');
  })
  .catch((err) => {
    console.error('FAIL:' + err.message);
    process.exit(1);
  });
" "$RESEND_API_KEY" "$EMAIL_FROM" "leonix23@gmail.com" 2>&1)

if [[ "$TEST_RESULT" != OK ]]; then
  echo "$TEST_RESULT"
  echo ""
  echo "Tip: onboarding@resend.dev only sends to the email you signed up to Resend with."
  echo "To email anyone, verify remotelymatch.app under Resend → Domains, then set:"
  echo "  EMAIL_FROM='remotelymatch <noreply@remotelymatch.app>'"
  exit 1
fi

echo "Resend test email sent to leonix23@gmail.com"

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  if [[ ! -f "$file" ]]; then
    touch "$file"
  fi
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    if [[ "$(uname)" == Darwin ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  else
    echo "${key}=${value}" >> "$file"
  fi
}

upsert_env "$ENV_FILE" "RESEND_API_KEY" "$RESEND_API_KEY"
upsert_env "$ENV_FILE" "EMAIL_FROM" "$EMAIL_FROM"
echo "Updated $ENV_FILE"

if [[ -n "${RENDER_API_KEY:-}" ]]; then
  echo "Updating Render environment..."
  SERVICE_ID=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services?limit=50" | node -e "
const data = JSON.parse(require('fs').readFileSync(0,'utf8'));
const svc = (Array.isArray(data) ? data : []).find((s) => s.service?.name === process.argv[1]);
if (!svc) process.exit(1);
console.log(svc.service.id);
" "$RENDER_SERVICE_NAME" 2>/dev/null || true)

  if [[ -z "${SERVICE_ID:-}" ]]; then
    echo "Could not find Render service '$RENDER_SERVICE_NAME' — set vars manually in dashboard."
  else
    for pair in "RESEND_API_KEY:$RESEND_API_KEY" "EMAIL_FROM:$EMAIL_FROM"; do
      KEY="${pair%%:*}"
      VAL="${pair#*:}"
      curl -s -X PUT "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/${KEY}" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"value\":$(node -e "console.log(JSON.stringify(process.argv[1]))" "$VAL")}" > /dev/null
    done
    echo "Render env updated. Redeploy from dashboard to apply."
  fi
else
  echo ""
  echo "Render (production) — add manually:"
  echo "  dashboard.render.com → remotelymatch → Environment"
  echo "  RESEND_API_KEY = $RESEND_API_KEY"
  echo "  EMAIL_FROM     = $EMAIL_FROM"
fi

echo ""
echo "Verify: https://remotematch.onrender.com/api/health → emailConfigured: true"
echo "Test:   Team → Invite a user"
