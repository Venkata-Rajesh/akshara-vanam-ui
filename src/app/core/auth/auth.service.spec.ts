import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
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
  });
});
