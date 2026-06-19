export const appName = import.meta.env.VITE_APP_NAME || 'RemoteMatch';
export const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
export const isProduction = import.meta.env.PROD;
