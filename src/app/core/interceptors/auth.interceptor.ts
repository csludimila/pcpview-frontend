import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. CORREÇÃO: Se a rota for de login ou cadastro (/auth), ignora o token e passa direto
  if (req.url.includes('/auth')) {
    return next(req);
  }

  // 2. Pegamos o token do localStorage para as outras rotas (produtos, máquinas, etc)
  const token = localStorage.getItem('auth_token');

  // 3. Se o token existir, coloca o crachá de autorização na requisição
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};