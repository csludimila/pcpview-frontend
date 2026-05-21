import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Pega o token que guardamos no momento do login
  const token = localStorage.getItem('token');
  
  // Não envia o token para as rotas de login e registro (pois ainda não temos token)
  if (req.url.includes('/auth')) {
    return next(req);
  }

  // Se tiver token, clona a requisição e anexa o token no cabeçalho
  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }
  
  return next(req);
};