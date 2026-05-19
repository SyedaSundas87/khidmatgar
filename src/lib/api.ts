import { Capacitor } from '@capacitor/core';

/**
 * Dynamically resolves relative API paths to absolute URLs when running inside a native mobile WebView (Capacitor).
 * Ensures that API calls connect to the Google Cloud Run server instead of attempting to connect to localhost on the phone.
 *
 * @param path The relative or absolute API path (e.g. '/api/proxy').
 * @returns The fully resolved URL.
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (Capacitor.isNativePlatform()) {
    const base = import.meta.env.VITE_API_BASE_URL || 'https://khidmatgar-cjq6e42ila-el.a.run.app';
    return `${base}${cleanPath}`;
  }
  return cleanPath;
};
