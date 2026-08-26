import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { adminGuard, authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()]
    });
  });

  it('permite acesso quando existe token', () => {
    localStorage.setItem('token', jwtFake('USER', Math.floor(Date.now() / 1000) + 3600));

    const result = TestBed.runInInjectionContext(() => authGuard(routeSnapshot(), routerStateSnapshot()));

    expect(result).toBeTrue();
  });

  it('redireciona para login quando token esta expirado', () => {
    localStorage.setItem('token', jwtFake('USER', Math.floor(Date.now() / 1000) - 10));

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => authGuard(routeSnapshot(), routerStateSnapshot()));

    expect(result).toEqual(router.createUrlTree(['/login']));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('redireciona para login quando nao existe token', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => authGuard(routeSnapshot(), routerStateSnapshot()));

    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});

describe('adminGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()]
    });
  });

  it('permite acesso para administrador autenticado', () => {
    localStorage.setItem('token', jwtFake('ADMIN', Math.floor(Date.now() / 1000) + 3600));
    localStorage.setItem('userRole', 'ADMIN');

    const result = TestBed.runInInjectionContext(() => adminGuard(routeSnapshot(), routerStateSnapshot()));

    expect(result).toBeTrue();
  });

  it('redireciona visitante para login', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => adminGuard(routeSnapshot(), routerStateSnapshot()));

    expect(result).toEqual(router.createUrlTree(['/login']));
  });

  it('redireciona operador autenticado para operacao', () => {
    localStorage.setItem('token', jwtFake('USER', Math.floor(Date.now() / 1000) + 3600));
    localStorage.setItem('userRole', 'USER');

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => adminGuard(routeSnapshot(), routerStateSnapshot()));

    expect(result).toEqual(router.createUrlTree(['/operacao']));
  });
});

function jwtFake(role: 'ADMIN' | 'USER', exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ role, exp }));
  return `${header}.${payload}.signature`;
}

function routeSnapshot(): ActivatedRouteSnapshot {
  return {} as ActivatedRouteSnapshot;
}

function routerStateSnapshot(): RouterStateSnapshot {
  return { url: '/teste' } as RouterStateSnapshot;
}
