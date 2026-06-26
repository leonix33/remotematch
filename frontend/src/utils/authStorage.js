import { clearOnboardingStep, clearProfileCache } from './profileDraft';

export function clearAuthStorage(userId) {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  if (userId) {
    clearProfileCache(userId);
    clearOnboardingStep(userId);
  }
}
