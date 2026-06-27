/** Canonical public domain — keep in sync with render.yaml CUSTOM_DOMAIN / APP_URL */
const CANONICAL_DOMAIN = 'remotelymatch.app';
const CANONICAL_APP_URL = `https://${CANONICAL_DOMAIN}`;
const DISPLAY_NAME = 'remotelymatch';

/** Legacy Render host (service slug predates rebrand) */
const LEGACY_RENDER_HOST = 'remotematch.onrender.com';
const LEGACY_RENDER_URL = `https://${LEGACY_RENDER_HOST}`;

/** Legacy / typo domains → 301 redirect to canonical */
const LEGACY_REDIRECT_HOSTS = new Set(['remotematch.app', 'www.remotematch.app']);

module.exports = {
  CANONICAL_DOMAIN,
  CANONICAL_APP_URL,
  DISPLAY_NAME,
  LEGACY_RENDER_HOST,
  LEGACY_RENDER_URL,
  LEGACY_REDIRECT_HOSTS,
};
