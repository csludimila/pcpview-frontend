import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RegisterComponent } from './register';
import { AuthService } from '../../../services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'registrar',
      'listarUsuarios',
      'promoverParaAdmin',
      'desativarUsuario'
    ]);
    authServiceSpy.registrar.and.returnValue(of(void 0));
    authServiceSpy.promoverParaAdmin.and.returnValue(of({
      id: '1',
      login: 'operador@pcpview.local',
      role: 'ADMIN'
    }));
    authServiceSpy.desativarUsuario.and.returnValue(of(void 0));
    authServiceSpy.listarUsuarios.and.returnValue(of([
      {
        id: '1',
        login: 'adminEquipSea@gmail.com',
        role: 'ADMIN'
      },
      {
        id: '2',
        login: 'operador@pcpview.local',
        role: 'USER'
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
    expect(component.usuarios.length).toBe(2);
    expect(component.loginUsuario(component.usuarios[0])).toBe('adminEquipSea@gmail.com');
  });

  it('deve bloquear cadastro com email invalido', () => {
    component.novoUsuario = {
      userName: 'Operador',
      email: 'email-invalido',
      password: '123456'
    };

    component.executarCadastro();

    expect(authServiceSpy.registrar).not.toHaveBeenCalled();
    expect(component.mensagemFeedback).toBe('Informe um e-mail válido para acesso.');
  });

  it('deve bloquear cadastro sem senha', () => {
    component.novoUsuario = {
      userName: 'Operador',
      email: 'operador@pcpview.local',
      password: ''
    };

    component.executarCadastro();

    expect(authServiceSpy.registrar).not.toHaveBeenCalled();
    expect(component.mensagemFeedback).toBe('Preencha nome, e-mail e senha para cadastrar.');
  });

  it('deve normalizar nome e email ao cadastrar', () => {
    component.novoUsuario = {
      userName: ' operador teste ',
      email: ' Operador@PCPView.Local ',
      password: '123456'
    };

    component.executarCadastro();

    expect(authServiceSpy.registrar).toHaveBeenCalledWith({
      userName: 'OPERADOR TESTE',
      email: 'operador@pcpview.local',
      password: '123456'
    });
    expect(component.mensagemFeedback).toBe('Usuário cadastrado com sucesso.');
    expect(authServiceSpy.listarUsuarios).toHaveBeenCalledTimes(2);
  });

  it('deve traduzir perfil para texto de tela', () => {
    expect(component.textoPerfil('ADMIN')).toBe('Administrador');
    expect(component.textoPerfil('USER')).toBe('Operador');
  });

  it('deve promover usuario para administrador', () => {
    const usuario = component.usuarios[1];

    component.promoverParaAdmin(usuario);

    expect(authServiceSpy.promoverParaAdmin).toHaveBeenCalledWith('2');
    expect(component.mensagemFeedback).toBe('operador@pcpview.local promovido para administrador.');
  });

  it('deve pedir confirmacao antes de desativar usuario', () => {
    const usuario = component.usuarios[1];

    component.desativarUsuario(usuario);

    expect(authServiceSpy.desativarUsuario).not.toHaveBeenCalled();
    expect(component.usuarioDesativacaoPendenteId).toBe('2');

    component.desativarUsuario(usuario);

    expect(authServiceSpy.desativarUsuario).toHaveBeenCalledWith('2');
  });
});
