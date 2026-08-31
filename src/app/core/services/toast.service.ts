import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private counter = 0;
  private readonly activeTimers = new Map<number, any>();

  showMessage(message: string, type: ToastType = 'info', duration: number = 3500): void {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, duration };

    this._toasts.update((existing) => [...existing, toast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.removeToast(id);
      }, duration);
      this.activeTimers.set(id, timer);
    }
  }

  success(message: string, duration?: number): void {
    this.showMessage(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.showMessage(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.showMessage(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    this.showMessage(message, 'warning', duration);
  }

  removeToast(id: number): void {
    const timer = this.activeTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(id);
    }
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  clearAll(): void {
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();
    this._toasts.set([]);
  }
}
