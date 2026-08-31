import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq).pipe(
      catchError((error) => {
        if (error.status === 401 && !req.url.includes('/auth/login')) {
          authService.clearSession();
          void router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });
        }
        return throwError(() => error);
      }),
    );
  }

  return next(req);
};
