import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import http from '../api/http';
import { isIOS, isAndroid, isMobileDevice } from '../utils/device';

const LAST_EMAIL_KEY = 'remotelymatch_last_email';

export function biometricLabel() {
  if (isIOS()) return 'Face ID';
  if (isAndroid()) return 'Fingerprint';
  return 'Biometric';
}

export async function supportsBiometricLogin() {
  if (typeof window === 'undefined') return false;
  if (!isMobileDevice()) return false;
  if (!browserSupportsWebAuthn()) return false;
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

export function rememberLoginEmail(email) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, String(email || '').trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function recalledLoginEmail() {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export async function registerPasskey(deviceLabel = '') {
  const { data: options } = await http.post('/auth/passkey/register/options');
  const attestation = await startRegistration({ optionsJSON: options });
  const { data } = await http.post('/auth/passkey/register/verify', {
    ...attestation,
    deviceLabel,
  });
  return data;
}

export async function loginWithPasskey(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) throw new Error('Enter your email first');
  const { data: options } = await http.post('/auth/passkey/login/options', { email: normalized });
  const assertion = await startAuthentication({ optionsJSON: options });
  const { data } = await http.post('/auth/passkey/login/verify', {
    email: normalized,
    ...assertion,
  });
  rememberLoginEmail(normalized);
  return data;
}

export async function fetchPasskeyStatus() {
  const { data } = await http.get('/auth/passkey/status');
  return data;
}

export async function removePasskeys() {
  const { data } = await http.delete('/auth/passkey');
  return data;
}
