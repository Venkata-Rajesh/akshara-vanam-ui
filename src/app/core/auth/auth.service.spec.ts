import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize unauthenticated by default if no stored session', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should authenticate user on successful login', async () => {
    const login = firstValueFrom(service.login({ email: 'test@gmail.com', password: 'test123' }));

    httpTesting.expectOne('http://localhost:3000/api/v1/auth/login').flush({
      data: {
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'Test User',
          email: 'test@gmail.com',
          role: 'user',
        },
        token: 'signed.jwt.token',
        message: 'Login successful',
      },
      message: 'Login successful',
    });

    const res = await login;
    expect(res.status).toBe('success');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('test@gmail.com');
  });

  it('should clear session on logout', async () => {
    const login = firstValueFrom(service.login({ email: 'test@gmail.com', password: 'test123' }));

    httpTesting.expectOne('http://localhost:3000/api/v1/auth/login').flush({
      data: {
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'Test User',
          email: 'test@gmail.com',
          role: 'user',
        },
        token: 'signed.jwt.token',
        message: 'Login successful',
      },
      message: 'Login successful',
    });

    await login;
    expect(service.isAuthenticated()).toBe(true);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('does not create a local session when the API is unavailable', async () => {
    const login = firstValueFrom(service.login({ email: 'test@gmail.com', password: 'test123' }));

    httpTesting
      .expectOne('http://localhost:3000/api/v1/auth/login')
      .error(new ProgressEvent('Network error'));

    await expect(login).rejects.toBeDefined();
    expect(service.isAuthenticated()).toBe(false);
  });
});
