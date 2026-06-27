#!/usr/bin/env bash
# Configure MONGODB_URI for Render production using your Atlas cluster.
# Usage:
#   MONGODB_PASSWORD='your-db_admin-password' ./scripts/configure-production-mongo.sh
# Or with Render API (auto-updates Render):
#   MONGODB_PASSWORD='...' RENDER_API_KEY='rnd_...' ./scripts/configure-production-mongo.sh

set -euo pipefail

ATLAS_USER="db_admin"
ATLAS_HOST="cluster0.73bhdry.mongodb.net"
ATLAS_DB="remotelymatch"
RENDER_SERVICE_NAME="remotematch"

if [[ -z "${MONGODB_PASSWORD:-}" ]]; then
  echo "Enter password for Atlas user '${ATLAS_USER}':"
  read -rs MONGODB_PASSWORD
  echo ""
fi

if [[ -z "$MONGODB_PASSWORD" ]]; then
  echo "Error: MONGODB_PASSWORD is required."
  exit 1
fi

# URL-encode password for connection string
ENCODED_PASS=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$MONGODB_PASSWORD")
MONGODB_URI="mongodb+srv://${ATLAS_USER}:${ENCODED_PASS}@${ATLAS_HOST}/${ATLAS_DB}?retryWrites=true&w=majority"

echo "Testing Atlas connection..."
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if ! node -e "
const path = require('path');
const mongoose = require(path.join(process.argv[2], 'backend/node_modules/mongoose'));
mongoose.connect(process.argv[1], { serverSelectionTimeoutMS: 20000 })
  .then(() => mongoose.connection.db.admin().command({ ping: 1 }))
  .then(() => { console.log('MongoDB Atlas connection OK'); return mongoose.disconnect(); })
  .catch((err) => { console.error('Connection failed:', err.message); process.exit(1); });
" "$MONGODB_URI" "$ROOT" 2>&1; then
  echo ""
  echo "Connection failed. Check:"
  echo "  1. Password is correct for user '${ATLAS_USER}'"
  echo "  2. Atlas → Network Access → 0.0.0.0/0 is allowed"
  exit 1
fi

echo ""
echo "Connection string (password hidden):"
echo "mongodb+srv://${ATLAS_USER}:****@${ATLAS_HOST}/${ATLAS_DB}?retryWrites=true&w=majority"
echo ""

if [[ -n "${RENDER_API_KEY:-}" ]]; then
  echo "Looking up Render service ID..."
  SERVICE_JSON=$(curl -sf \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Accept: application/json" \
    "https://api.render.com/v1/services?limit=50")

  SERVICE_ID=$(node -e "
const rows = JSON.parse(process.argv[1]);
const match = rows.find((r) => r.service?.name === process.argv[2]);
if (!match) { console.error('Service not found: ' + process.argv[2]); process.exit(1); }
console.log(match.service.id);
" "$SERVICE_JSON" "$RENDER_SERVICE_NAME")

  echo "Updating MONGODB_URI on Render service ${SERVICE_ID}..."
  curl -sf -X PUT \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"value\":$(node -e "console.log(JSON.stringify(process.argv[1]))" "$MONGODB_URI")}" \
    "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/MONGODB_URI"

  echo ""
  echo "Triggering deploy..."
  curl -sf -X POST \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "https://api.render.com/v1/services/${SERVICE_ID}/deploys" > /dev/null || true

  echo "Done. Wait ~2 minutes, then check:"
  echo "  https://remotematch.onrender.com/api/health"
  exit 0
fi

# No Render API key — copy to clipboard and open dashboard
if command -v pbcopy >/dev/null; then
  printf '%s' "$MONGODB_URI" | pbcopy
  echo "Copied MONGODB_URI to clipboard."
fi

echo "Paste into Render → remotelymatch → Environment → MONGODB_URI"
echo "Then click Save, rebuild, and deploy."
open "https://dashboard.render.com" 2>/dev/null || true
