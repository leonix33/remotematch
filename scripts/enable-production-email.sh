#!/usr/bin/env bash
# Verify remotelymatch.app in Resend and switch production to noreply@remotelymatch.app.
#
# Usage:
#   RESEND_API_KEY='re_...' ./scripts/enable-production-email.sh
# With Render API (updates EMAIL_FROM + triggers redeploy):
#   RESEND_API_KEY='re_...' RENDER_API_KEY='rnd_...' ./scripts/enable-production-email.sh

set -euo pipefail

DOMAIN="${CUSTOM_DOMAIN:-remotelymatch.app}"
APP_NAME="${APP_NAME:-RemotelyMatch}"
EMAIL_FROM="${EMAIL_FROM:-$APP_NAME <noreply@$DOMAIN>}"
TEST_TO="${TEST_TO:-leonix23@gmail.com}"
RENDER_SERVICE_NAME="${RENDER_SERVICE_NAME:-remotematch}"

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "Paste your Resend API key (starts with re_):"
  read -rs RESEND_API_KEY
  echo ""
fi

if [[ -z "$RESEND_API_KEY" || "$RESEND_API_KEY" != re_* ]]; then
  echo "Error: RESEND_API_KEY must start with re_"
  exit 1
fi

echo "Checking Resend domain: $DOMAIN ..."
DOMAIN_JSON=$(curl -sS -H "Authorization: Bearer $RESEND_API_KEY" \
  "https://api.resend.com/domains")

DOMAIN_STATUS=$(node -e "
const data = JSON.parse(process.argv[1]);
const list = data.data || data || [];
const row = list.find((d) => (d.name || d.domain || '').toLowerCase() === process.argv[2].toLowerCase());
if (!row) {
  console.log('missing');
  process.exit(0);
}
console.log(row.status || row.verification?.status || 'unknown');
" "$DOMAIN_JSON" "$DOMAIN")

if [[ "$DOMAIN_STATUS" != "verified" ]]; then
  echo ""
  echo "Domain $DOMAIN is not verified yet (status: ${DOMAIN_STATUS:-not added})."
  echo ""
  echo "1. https://resend.com/domains → Add $DOMAIN"
  echo "2. Cloudflare → $DOMAIN → DNS → add TXT + CNAME from Resend"
  echo "3. Click Verify in Resend (green checkmark)"
  echo "4. Re-run this script"
  exit 1
fi

echo "Domain verified ✓"
echo "Sending test email from: $EMAIL_FROM → $TEST_TO"

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
    subject: process.argv[4] + ' — production email test',
    html: '<p>Production Resend is working. Digests and invites will send from <strong>' + process.argv[2] + '</strong>.</p>',
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
" "$RESEND_API_KEY" "$EMAIL_FROM" "$TEST_TO" "$APP_NAME" 2>&1)

if [[ "$TEST_RESULT" != OK ]]; then
  echo "$TEST_RESULT"
  exit 1
fi

echo "Test email sent ✓"

if [[ -n "${RENDER_API_KEY:-}" ]]; then
  echo "Updating Render EMAIL_FROM..."
  SERVICE_ID=$(curl -sS -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services?limit=50" | node -e "
const data = JSON.parse(require('fs').readFileSync(0,'utf8'));
const svc = (Array.isArray(data) ? data : []).find((s) => s.service?.name === process.argv[1]);
if (!svc) process.exit(1);
console.log(svc.service.id);
" "$RENDER_SERVICE_NAME" 2>/dev/null || true)

  if [[ -z "${SERVICE_ID:-}" ]]; then
    echo "Could not find Render service '$RENDER_SERVICE_NAME' — set EMAIL_FROM manually:"
    echo "  $EMAIL_FROM"
  else
    curl -sS -X PUT "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/EMAIL_FROM" \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"value\":$(node -e "console.log(JSON.stringify(process.argv[1]))" "$EMAIL_FROM")}" > /dev/null

    curl -sS -X POST "https://api.render.com/v1/services/${SERVICE_ID}/deploys" \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{}' > /dev/null

    echo "Render updated and redeploy triggered."
  fi
else
  echo ""
  echo "Render dashboard → remotematch → Environment:"
  echo "  EMAIL_FROM = $EMAIL_FROM"
  echo "Then redeploy (or push to main — auto-deploy picks up env.js default)."
fi

echo ""
echo "Verify: https://remotelymatch.app/api/health"
echo "  emailProduction: true"
echo "  emailFrom: $EMAIL_FROM"
