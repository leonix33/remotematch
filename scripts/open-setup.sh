#!/usr/bin/env bash
# Opens Render + MongoDB setup pages. Paste secrets in Render → remotelymatch → Environment.
set -e
echo "Opening setup pages in your browser..."
open "https://dashboard.render.com" 2>/dev/null || xdg-open "https://dashboard.render.com" 2>/dev/null || true
open "https://cloud.mongodb.com" 2>/dev/null || true
echo ""
echo "=== Render → remotelymatch → Environment ==="
echo "Required for full features:"
echo "  MONGODB_URI     = mongodb+srv://USER:PASS@cluster.../remotelymatch"
echo "  ADMIN_EMAIL     = leonix23@gmail.com"
echo "  ADMIN_PASSWORD  = (your login password)"
echo ""
echo "Optional:"
echo "  OPENAI_API_KEY  = sk-..."
echo "  RESEND_API_KEY  = re_..."
echo ""
if command -v node >/dev/null; then
  echo "=== VAPID keys (for push notifications) ==="
  node "$(dirname "$0")/../backend/scripts/gen-vapid.js"
fi
echo ""
echo "Chrome extension: chrome://extensions → Load unpacked → chrome-extension/"
echo "Then Profile → Get extension token → paste in extension Settings"
