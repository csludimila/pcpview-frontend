import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RegisterComponent } from './register';
import { AuthService } from '../../../services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['registrar', 'listarUsuarios', 'redefinirSenha']);
    authServiceSpy.registrar.and.returnValue(of(void 0));
    authServiceSpy.redefinirSenha.and.returnValue(of(void 0));
    authServiceSpy.listarUsuarios.and.returnValue(of([
      {
        id: '1',
        userName: 'ADMIN',
        email: 'admin@pcpview.local',
        role: 'ADMIN'
      }
    ]));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar usuarios cadastrados ao abrir a tela', () => {
    expect(authServiceSpy.listarUsuarios).toHaveBeenCalled();
    expect(component.usuarios.length).toBe(1);
    expect(component.usuarios[0].email).toBe('admin@pcpview.local');
  });

  it('deve bloquear cadastro com email invalido', () => {
    component.novoUsuario = {
      userName: 'Operador',
      email: 'email-invalido',
      password: '12345678',
      role: 'USER'
    };

    component.executarCadastro();

    expect(authServiceSpy.registrar).not.toHaveBeenCalled();
    expect(component.mensagemFeedback).toBe('Informe um e-mail válido para acesso.');
  });

  it('deve bloquear cadastro com senha curta', () => {
    component.novoUsuario = {
      userName: 'Operador',
      email: 'operador@pcpview.local',
      password: '123',
      role: 'USER'
    };

    component.executarCadastro();

    expect(authServiceSpy.registrar).not.toHaveBeenCalled();
    expect(component.mensagemFeedback).toBe('A senha deve ter pelo menos 8 caracteres.');
  });

  it('deve normalizar nome e email ao cadastrar', () => {
    component.novoUsuario = {
      userName: ' operador teste ',
      email: ' Operador@PCPView.Local ',
      password: '12345678',
      role: 'USER'
    };

    component.executarCadastro();

    expect(authServiceSpy.registrar).toHaveBeenCalledWith({
      userName: 'OPERADOR TESTE',
      email: 'operador@pcpview.local',
      password: '12345678',
      role: 'USER'
    });
    expect(component.mensagemFeedback).toBe('Usuário cadastrado com sucesso.');
    expect(authServiceSpy.listarUsuarios).toHaveBeenCalledTimes(2);
  });

  it('deve traduzir perfil para texto de tela', () => {
    expect(component.textoPerfil('ADMIN')).toBe('Administrador');
    expect(component.textoPerfil('USER')).toBe('Operador');
  });

  it('deve permitir redefinir senha de usuario', () => {
    const usuario = component.usuarios[0];

    component.iniciarRedefinicaoSenha(usuario);
    component.senhasReset[usuario.id || ''] = '87654321';
    component.redefinirSenha(usuario);

    expect(authServiceSpy.redefinirSenha).toHaveBeenCalledWith('1', { password: '87654321' });
    expect(component.usuarioResetSenhaId).toBe('');
    expect(component.mensagemFeedback).toBe('Senha de admin@pcpview.local redefinida com sucesso.');
  });

  it('deve bloquear redefinicao de senha curta', () => {
    const usuario = component.usuarios[0];

    component.iniciarRedefinicaoSenha(usuario);
    component.senhasReset[usuario.id || ''] = '123';
    component.redefinirSenha(usuario);

    expect(authServiceSpy.redefinirSenha).not.toHaveBeenCalled();
    expect(component.mensagemFeedback).toBe('A nova senha deve ter pelo menos 8 caracteres.');
  });
});
