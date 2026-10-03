import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should not add Authorization header if user is not authenticated', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Authorization Bearer header if token exists', () => {
    authService.setSession(
      { id: '1', email: 'test@gmail.com', username: 'Test' },
      'sample_jwt_token_123',
    );

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer sample_jwt_token_123');
    req.flush({});
  });
});
