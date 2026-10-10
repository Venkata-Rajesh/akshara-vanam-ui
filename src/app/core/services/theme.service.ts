import { effect, signal, Service } from '@angular/core';

@Service()
export class ThemeService {
  private readonly storageKey = 'theme-preference';
  private transitionTimer?: ReturnType<typeof setTimeout>;

  readonly isDark = signal<boolean>(this.getPreferredTheme());

  constructor() {
    this.applyTheme(this.isDark());

    effect(() => {
      const darkMode = this.isDark();
      this.applyTheme(darkMode);
      localStorage.setItem(this.storageKey, darkMode ? 'dark' : 'light');
    });
  }

  toggleTheme(origin?: { x: number; y: number }): void {
    this.setTheme(!this.isDark(), origin);
  }

  setTheme(isDark: boolean, origin?: { x: number; y: number }): void {
    if (isDark === this.isDark()) return;

    if (typeof document === 'undefined' || typeof window === 'undefined') {
      this.isDark.set(isDark);
      return;
    }

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.isDark.set(isDark);
      return;
    }

    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const radius = Math.min(
      320,
      Math.max(190, Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) * 0.24)),
    );
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
    root.removeAttribute('data-theme-transition');
    root.style.setProperty('--theme-origin-x', `${x}px`);
    root.style.setProperty('--theme-origin-y', `${y}px`);
    root.style.setProperty('--theme-reveal-radius', `${radius}px`);
    this.applyTheme(isDark);
    this.isDark.set(isDark);
    root.setAttribute('data-theme-transition', isDark ? 'nightfall' : 'sunrise');

    this.transitionTimer = window.setTimeout(() => {
      root.removeAttribute('data-theme-transition');
      root.style.removeProperty('--theme-origin-x');
      root.style.removeProperty('--theme-origin-y');
      root.style.removeProperty('--theme-reveal-radius');
      this.transitionTimer = undefined;
    }, 1900);
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
