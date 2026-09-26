import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
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
    spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize unauthenticated by default if no stored session', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should authenticate user on successful login', (done) => {
    service.login({ email: 'test@gmail.com', password: 'test123' }).subscribe({
      next: (res) => {
        expect(res.status).toBe('success');
        expect(service.isAuthenticated()).toBeTrue();
        expect(service.currentUser()?.email).toBe('test@gmail.com');
        done();
      },
      error: done.fail,
    });

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
  });

  it('should clear session on logout', (done) => {
    service.login({ email: 'test@gmail.com', password: 'test123' }).subscribe({
      next: () => {
        expect(service.isAuthenticated()).toBeTrue();
        service.logout();
        expect(service.isAuthenticated()).toBeFalse();
        expect(service.currentUser()).toBeNull();
        done();
      },
      error: done.fail,
    });

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
  });

  it('does not create a local session when the API is unavailable', (done) => {
    service.login({ email: 'test@gmail.com', password: 'test123' }).subscribe({
      next: () => done.fail('Expected the API error to be surfaced'),
      error: () => {
        expect(service.isAuthenticated()).toBeFalse();
        done();
      },
    });

    httpTesting
      .expectOne('http://localhost:3000/api/v1/auth/login')
      .error(new ProgressEvent('Network error'));
  });
});
