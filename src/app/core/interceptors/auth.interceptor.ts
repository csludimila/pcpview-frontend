import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (isAuthPublicRequest(req)) {
    return next(req);
  }

  return next(withAuthHeader(req, authService.getToken())).pipe(
    catchError((error: HttpErrorResponse) => encerrarSessao(error, router, authService))
  );
};

function withAuthHeader(req: HttpRequest<unknown>, token: string | null) {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}

function isAuthPublicRequest(req: HttpRequest<unknown>): boolean {
  return req.url.endsWith('/auth/login') ||
    (req.url.endsWith('/auth') && req.method === 'POST');
}

function encerrarSessao(error: HttpErrorResponse, router: Router, authService: AuthService) {
  if (error.status === 401 && !router.url.includes('/login')) {
    authService.logout();
    router.navigate(['/login']);
  }

  return throwError(() => error);
}
