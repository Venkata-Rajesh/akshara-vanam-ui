import { InjectionToken } from '@angular/core';

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const configuredApiUrl =
      typeof window === 'undefined' ? undefined : window.__APP_CONFIG__?.apiBaseUrl;
    return configuredApiUrl?.replace(/\/+$/, '') || 'http://localhost:3000/api/v1';
  },
});
