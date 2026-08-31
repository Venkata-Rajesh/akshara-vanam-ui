import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    service.clearAll();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add toast notification to toasts signal', () => {
    service.success('Operation succeeded');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Operation succeeded');
    expect(toasts[0].type).toBe('success');
  });

  it('should remove toast by id', () => {
    service.info('Info message');
    const toastId = service.toasts()[0].id;
    service.removeToast(toastId);
    expect(service.toasts().length).toBe(0);
  });

  it('should clear all toasts', () => {
    service.success('Toast 1');
    service.error('Toast 2');
    expect(service.toasts().length).toBe(2);
    service.clearAll();
    expect(service.toasts().length).toBe(0);
  });
});
