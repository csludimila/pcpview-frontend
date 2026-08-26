import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (isAuthPublicRequest(req.url)) {
    return next(req);
  }

  if (authService.deveRenovarToken()) {
    return authService.renovarSessao().pipe(
      switchMap(() => next(withAuthHeader(req, authService.getToken()))),
      catchError((error: HttpErrorResponse) => encerrarSessao(error, router, authService))
    );
  }

  return next(withAuthHeader(req, authService.getToken())).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authService.getRefreshToken()) {
        return authService.renovarSessao().pipe(
          switchMap(() => next(withAuthHeader(req, authService.getToken()))),
          catchError((refreshError: HttpErrorResponse) => encerrarSessao(refreshError, router, authService))
        );
      }

      return encerrarSessao(error, router, authService);
    })
  );
};

function withAuthHeader(req: HttpRequest<unknown>, token: string | null) {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}

function isAuthPublicRequest(url: string): boolean {
  return url.endsWith('/auth/login') || url.endsWith('/auth/refresh') || url.endsWith('/auth/logout');
}

function encerrarSessao(error: HttpErrorResponse, router: Router, authService: AuthService) {
  if (error.status === 401 && !router.url.includes('/login')) {
    authService.logout();
    router.navigate(['/login']);
  }

  return throwError(() => error);
}
