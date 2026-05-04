import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Pegamos o token que salvamos no localStorage durante o Login
  const token = localStorage.getItem('auth_token');

  // 2. Se o token existir, "clonamos" a requisição e colocamos o crachá nela
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // 3. Se não tiver token, a requisição segue normal (ex: para o próprio Login)
  return next(req);
};