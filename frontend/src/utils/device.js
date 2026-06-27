export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  if (isIOS() || isAndroid()) return true;
  return window.matchMedia?.('(max-width: 768px)')?.matches ?? false;
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

/** Rough iOS major version from user agent, or null */
export function iosMajorVersion() {
  if (!isIOS()) return null;
  const m = navigator.userAgent.match(/OS (\d+)[_.]/);
  return m ? Number(m[1]) : null;
}

export function supportsHomeScreenInstall() {
  const v = iosMajorVersion();
  if (v === null) return true;
  return v >= 7;
}

export function isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat/i.test(ua);
}

export function isIOSSafari() {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

/** native = Chrome install prompt; ios | android-manual | in-app | desktop */
export function getInstallMode() {
  if (isStandalonePwa()) return 'installed';
  if (isInAppBrowser()) return 'in-app';
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'desktop';
}
