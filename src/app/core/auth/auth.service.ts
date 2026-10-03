import { HttpClient } from '@angular/common/http';
import { computed, inject, signal, Service } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import {
  ApiResponse,
  AuthResponse,
  AuthUser,
  LoginCredentials,
  SignupCredentials,
} from './auth.models';
import { ToastService } from '../services/toast.service';
import { API_BASE_URL } from '../config/api.config';

const TOKEN_KEY = 'auth_jwt_token_v2';
const USER_KEY = 'auth_current_user_v2';
const LEGACY_KEYS = ['test_auth_jwt_token', 'test_auth_current_user', 'test_auth_registered_users'];

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly _currentUser = signal<AuthUser | null>(this.getStoredUser());
  private readonly _token = signal<string | null>(this.getStoredToken());

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !!this._currentUser());

  signup(credentials: SignupCredentials): Observable<AuthResponse> {
    const signupPayload = {
      username: credentials.username.trim(),
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };

    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiBaseUrl}/auth/signup`, signupPayload)
      .pipe(
        map((res) => {
          const result = res.data;
          const user = { ...result.user, username: result.user.username || credentials.username };
          return {
            user,
            token: result.token,
            message: res.message || result.message || 'Registration successful',
            status: 'success' as const,
          };
        }),
        catchError((error: HttpErrorResponse) => throwError(() => this.toApiError(error))),
      );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginPayload = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };

    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiBaseUrl}/auth/login`, loginPayload)
      .pipe(
        map((res) => {
          const result = res.data;
          const user: AuthUser = {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            role: result.user?.role,
            avatarUrl: result.user?.avatarUrl,
          };
          return {
            user,
            token: result.token,
            message: res.message || result.message || 'Login successful',
            status: 'success' as const,
          };
        }),
        catchError((error: HttpErrorResponse) => throwError(() => this.toApiError(error))),
        tap((authRes) => {
          this.setSession(authRes.user, authRes.token);
        }),
      );
  }

  logout(): void {
    this._currentUser.set(null);
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.toast.info('You have been signed out.');
    this.router.navigate(['/login']);
  }

  setSession(user: AuthUser, token: string): void {
    this._currentUser.set(user);
    this._token.set(token);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getToken(): string | null {
    return this._token();
  }

  clearSession(): void {
    this._currentUser.set(null);
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.apiBaseUrl}/auth/me`).pipe(
      map((res) => res.data),
      tap((user) => this._currentUser.set(user)),
    );
  }

  requestPasswordReset(email: string): Observable<string | null> {
    return this.http
      .post<
        ApiResponse<{ resetUrl?: string }>
      >(`${this.apiBaseUrl}/auth/forgot-password`, { email: email.trim().toLowerCase() })
      .pipe(map((res) => res.data?.resetUrl ?? null));
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http
      .post<
        ApiResponse<null>
      >(`${this.apiBaseUrl}/auth/reset-password/${encodeURIComponent(token)}`, { password })
      .pipe(map(() => undefined));
  }

  private getStoredToken(): string | null {
    try {
      this.clearLegacyStorage();
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && this.isMockToken(token)) {
        this.clearSession();
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  private getStoredUser(): AuthUser | null {
    try {
      this.clearLegacyStorage();
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && this.isMockToken(token)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private isMockToken(token: string): boolean {
    try {
      return atob(token.split('.')[2] || '').startsWith('dummy_signature_');
    } catch {
      return false;
    }
  }

  private clearLegacyStorage(): void {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  }

  private toApiError(error: HttpErrorResponse): Error {
    return new Error(error.error?.message || error.message || 'Request failed');
  }
}
