export interface AuthUser {
  id?: string;
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  message: string;
  status: 'success' | 'error';
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  errors?: unknown[];
  timestamp: string;
}
