const CACHE_PREFIX = 'remotematch_profile_';
const ONBOARDING_PREFIX = 'remotematch_onboarding_step_';

export function profileCacheKey(userId) {
  return userId ? `${CACHE_PREFIX}${userId}` : null;
}

export function readProfileCache(userId) {
  const key = profileCacheKey(userId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    delete parsed._cachedAt;
    return parsed;
  } catch {
    return null;
  }
}

export function writeProfileCache(userId, profile) {
  const key = profileCacheKey(userId);
  if (!key || !profile) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ...profile, _cachedAt: Date.now() }));
  } catch {
    /* storage full — ignore */
  }
}

export function clearProfileCache(userId) {
  const key = profileCacheKey(userId);
  if (key) localStorage.removeItem(key);
}

export function readOnboardingStep(userId) {
  if (!userId) return 1;
  try {
    const n = Number(localStorage.getItem(`${ONBOARDING_PREFIX}${userId}`));
    return n >= 1 && n <= 3 ? n : 1;
  } catch {
    return 1;
  }
}

export function writeOnboardingStep(userId, step) {
  if (!userId) return;
  try {
    localStorage.setItem(`${ONBOARDING_PREFIX}${userId}`, String(step));
  } catch {
    /* ignore */
  }
}

export function clearOnboardingStep(userId) {
  if (!userId) return;
  localStorage.removeItem(`${ONBOARDING_PREFIX}${userId}`);
}
