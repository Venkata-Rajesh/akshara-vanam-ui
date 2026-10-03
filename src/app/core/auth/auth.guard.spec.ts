import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('Auth Guards', () => {
  let authService: AuthService;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/quotes' } as RouterStateSnapshot;

  const executeAuthGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  const executeGuestGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guestGuard(...guardParameters));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('authGuard should redirect unauthenticated users to /login', () => {
    const result = executeAuthGuard(mockRoute, mockState);
    expect(result instanceof UrlTree).toBe(true);
    if (result instanceof UrlTree) {
      expect(result.toString()).toContain('/login');
    }
  });

  it('authGuard should allow authenticated users to proceed', () => {
    authService.setSession({ id: '1', email: 'test@gmail.com', username: 'Test' }, 'mock_token');
    const result = executeAuthGuard(mockRoute, mockState);
    expect(result).toBe(true);
  });

  it('guestGuard should redirect authenticated users to /quotes', () => {
    authService.setSession({ id: '1', email: 'test@gmail.com', username: 'Test' }, 'mock_token');
    const result = executeGuestGuard(mockRoute, mockState);
    expect(result instanceof UrlTree).toBe(true);
    if (result instanceof UrlTree) {
      expect(result.toString()).toBe('/quotes');
    }
  });

  it('guestGuard should allow unauthenticated users to access /login', () => {
    const result = executeGuestGuard(mockRoute, mockState);
    expect(result).toBe(true);
  });
});
