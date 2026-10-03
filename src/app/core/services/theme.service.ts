import { effect, signal, Service } from '@angular/core';

@Service()
export class ThemeService {
  private readonly storageKey = 'theme-preference';

  readonly isDark = signal<boolean>(this.getPreferredTheme());

  constructor() {
    this.applyTheme(this.isDark());

    effect(() => {
      const darkMode = this.isDark();
      this.applyTheme(darkMode);
      localStorage.setItem(this.storageKey, darkMode ? 'dark' : 'light');
    });
  }

  toggleTheme(): void {
    this.isDark.update((current) => !current);
  }

  setTheme(isDark: boolean): void {
    this.isDark.set(isDark);
  }

  private getPreferredTheme(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const storedTheme = localStorage.getItem(this.storageKey);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme === 'dark';
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
  }
}
