import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from './login';
import { AuthService } from '../../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'getRole']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('redireciona administrador para planejamento', () => {
    authServiceSpy.login.and.returnValue(of({ token: 'token-admin' }));
    authServiceSpy.getRole.and.returnValue('ADMIN');
    spyOn(router, 'navigate');

    component.email = 'admin@pcpview.local';
    component.password = '123456';
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/planejamento']);
  });

  it('redireciona operador para operacao', () => {
    authServiceSpy.login.and.returnValue(of({ token: 'token-operador' }));
    authServiceSpy.getRole.and.returnValue('USER');
    spyOn(router, 'navigate');

    component.email = 'operador@pcpview.local';
    component.password = '123456';
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/operacao']);
  });

  it('remove espacos externos do e-mail antes de autenticar', () => {
    authServiceSpy.login.and.returnValue(of({ token: 'token-admin' }));
    authServiceSpy.getRole.and.returnValue('ADMIN');
    spyOn(router, 'navigate');

    component.email = '  admin@pcpview.local  ';
    component.password = '123456';
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'admin@pcpview.local',
      password: '123456'
    });
    expect(component.email).toBe('admin@pcpview.local');
  });

  it('bloqueia formato de e-mail invalido antes de chamar a API', () => {
    component.email = 'usuario-invalido';
    component.password = '123456';
    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Informe um endereço de e-mail válido.');
  });
});
