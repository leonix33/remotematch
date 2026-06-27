/** Canonical product identity — keep in sync with frontend/src/constants/domain.js */
const DISPLAY_NAME = 'remotelymatch';
const CANONICAL_DOMAIN = 'remotelymatch.app';
const CANONICAL_APP_URL = `https://${CANONICAL_DOMAIN}`;

/** Legacy Render hostname (service slug predates rebrand) */
const LEGACY_RENDER_HOST = 'remotematch.onrender.com';
const LEGACY_RENDER_URL = `https://${LEGACY_RENDER_HOST}`;

const USER_AGENT = `${DISPLAY_NAME}/1.0 (+${CANONICAL_APP_URL})`;
const MONGO_DB_NAME = 'remotelymatch';

module.exports = {
  DISPLAY_NAME,
  CANONICAL_DOMAIN,
  CANONICAL_APP_URL,
  LEGACY_RENDER_HOST,
  LEGACY_RENDER_URL,
  USER_AGENT,
  MONGO_DB_NAME,
};
