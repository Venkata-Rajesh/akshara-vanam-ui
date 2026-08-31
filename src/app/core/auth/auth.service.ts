import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, delay, map, Observable, of, tap, throwError } from 'rxjs';
import {
  ApiResponse,
  AuthResponse,
  AuthUser,
  LoginCredentials,
  SignupCredentials,
} from './auth.models';
import { ToastService } from '../services/toast.service';
import { API_BASE_URL } from '../config/api.config';

const TOKEN_KEY = 'test_auth_jwt_token';
const USER_KEY = 'test_auth_current_user';
const USERS_STORE_KEY = 'test_auth_registered_users';

@Injectable({
  providedIn: 'root',
})
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

  constructor() {
    this.seedDefaultTestUser();
  }

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
          const token = result.token || this.generateMockToken(user);
          this.saveUserInLocalRegistry(signupPayload);
          return {
            user,
            token,
            message: res.message || result.message || 'Registration successful',
            status: 'success' as const,
          };
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 0) return throwError(() => this.toApiError(error));
          // Fallback for offline / standalone mode
          const users = this.getLocalRegistry();
          const existing = users.find((u) => u.email === signupPayload.email);
          if (existing) {
            return throwError(() => new Error('An account with this email already exists'));
          }

          const newUser: AuthUser = {
            id: 'usr_' + Date.now(),
            username: signupPayload.username,
            email: signupPayload.email,
          };
          this.saveUserInLocalRegistry(signupPayload);
          const token = this.generateMockToken(newUser);

          const response: AuthResponse = {
            user: newUser,
            token,
            message: 'Account created successfully!',
            status: 'success',
          };

          return of(response).pipe(delay(300));
        }),
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
            id: result.user?.id || 'usr_' + Date.now(),
            username: result.user?.username || loginPayload.email.split('@')[0],
            email: loginPayload.email,
            role: result.user?.role,
            avatarUrl: result.user?.avatarUrl,
          };
          const token = result.token || this.generateMockToken(user);
          return {
            user,
            token,
            message: res.message || result.message || 'Login successful',
            status: 'success' as const,
          };
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 0) return throwError(() => this.toApiError(error));
          // Fallback for offline / standalone demo mode
          const users = this.getLocalRegistry();
          const found = users.find(
            (u) => u.email === loginPayload.email && u.password === loginPayload.password,
          );

          if (!found) {
            return throwError(() => new Error('Invalid email or password'));
          }

          const user: AuthUser = {
            id: found.id || 'usr_' + Date.now(),
            username: found.username || found.email.split('@')[0],
            email: found.email,
          };
          const token = this.generateMockToken(user);

          const response: AuthResponse = {
            user,
            token,
            message: 'Login successful!',
            status: 'success',
          };

          return of(response).pipe(delay(300));
        }),
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

  requestPasswordReset(email: string): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${this.apiBaseUrl}/auth/forgot-password`, { email: email.trim().toLowerCase() })
      .pipe(map(() => undefined));
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${this.apiBaseUrl}/auth/reset-password/${encodeURIComponent(token)}`, { password })
      .pipe(map(() => undefined));
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getLocalRegistry(): Array<SignupCredentials & { id?: string }> {
    try {
      const data = localStorage.getItem(USERS_STORE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveUserInLocalRegistry(user: SignupCredentials): void {
    try {
      const users = this.getLocalRegistry();
      const existingIdx = users.findIndex((u) => u.email === user.email);
      if (existingIdx >= 0) {
        users[existingIdx] = user;
      } else {
        users.push({ ...user, id: 'usr_' + Date.now() });
      }
      localStorage.setItem(USERS_STORE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save to local registry', e);
    }
  }

  private seedDefaultTestUser(): void {
    const users = this.getLocalRegistry();
    if (!users.some((u) => u.email === 'test@gmail.com')) {
      users.push({
        id: 'usr_demo_test',
        username: 'Test User',
        email: 'test@gmail.com',
        password: 'test123',
      });
      localStorage.setItem(USERS_STORE_KEY, JSON.stringify(users));
    }
  }

  private generateMockToken(user: AuthUser): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        username: user.username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      }),
    );
    const signature = btoa('dummy_signature_' + Math.random().toString(36).substring(2));
    return `${header}.${payload}.${signature}`;
  }

  private toApiError(error: HttpErrorResponse): Error {
    return new Error(error.error?.message || error.message || 'Request failed');
  }
}
