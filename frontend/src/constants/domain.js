/** Canonical public URL — must match render.yaml CUSTOM_DOMAIN / APP_URL */
export const CANONICAL_DOMAIN = 'remotelymatch.app';
export const CANONICAL_APP_URL = `https://${CANONICAL_DOMAIN}`;
export const DISPLAY_NAME = 'remotelymatch';

export function resolveShareUrl() {
  if (typeof window === 'undefined') return CANONICAL_APP_URL;
  const host = window.location.hostname.replace(/^www\./, '');
  if (
    host === CANONICAL_DOMAIN ||
    host === 'remotematch.onrender.com' ||
    import.meta.env.PROD
  ) {
    return CANONICAL_APP_URL;
  }
  return window.location.origin;
}
