import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { RegisterRequestDTO, UserResponseDTO } from '../../../models/api.models';
import { apiErrorMessage } from '../../../shared/api-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  mensagemFeedback = '';
  isCarregando = false;
  usuarios: UserResponseDTO[] = [];
  usuarioDesativacaoPendenteId = '';
  
  novoUsuario: RegisterRequestDTO = {
    userName: '',
    email: '',
    password: ''
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.carregarUsuarios();
  }

  get emailValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.novoUsuario.email.trim());
  }

  get senhaValida(): boolean {
    return this.novoUsuario.password.trim().length > 0;
  }

  get podeCadastrar(): boolean {
    return !!this.novoUsuario.userName.trim() &&
      this.emailValido &&
      this.senhaValida &&
      !this.isCarregando;
  }

  executarCadastro() {
    this.mensagemFeedback = '';

    if (!this.novoUsuario.userName.trim() || !this.novoUsuario.email.trim() || !this.novoUsuario.password.trim()) {
      this.mensagemFeedback = 'Preencha nome, e-mail e senha para cadastrar.';
      return;
    }

    if (!this.emailValido) {
      this.mensagemFeedback = 'Informe um e-mail válido para acesso.';
      return;
    }

    if (!this.senhaValida) {
      this.mensagemFeedback = 'Informe uma senha para cadastrar o usuário.';
      return;
    }

    this.isCarregando = true;
    this.authService.registrar({
      ...this.novoUsuario,
      userName: this.novoUsuario.userName.trim().toUpperCase(),
      email: this.novoUsuario.email.trim().toLowerCase(),
      password: this.novoUsuario.password.trim()
    }).subscribe({
      next: () => {
        this.novoUsuario = { userName: '', email: '', password: '' };
        this.mensagemFeedback = 'Usuário cadastrado com sucesso.';
        this.carregarUsuarios();
        this.isCarregando = false;
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao cadastrar usuário.');
        this.isCarregando = false;
      }
    });
  }

  carregarUsuarios() {
    this.authService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        if (this.usuarioDesativacaoPendenteId && !usuarios.some((usuario) => usuario.id === this.usuarioDesativacaoPendenteId)) {
          this.usuarioDesativacaoPendenteId = '';
        }
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar usuários cadastrados.');
      }
    });
  }

  promoverParaAdmin(usuario: UserResponseDTO) {
    if (!usuario.id) return;
    if (usuario.role === 'ADMIN') {
      this.mensagemFeedback = 'Este usuário já é administrador.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';

    this.authService.promoverParaAdmin(usuario.id).subscribe({
      next: () => {
        this.mensagemFeedback = `${this.loginUsuario(usuario)} promovido para administrador.`;
        this.carregarUsuarios();
        this.isCarregando = false;
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao promover usuário.');
        this.isCarregando = false;
      }
    });
  }

  desativarUsuario(usuario: UserResponseDTO) {
    if (!usuario.id) return;

    if (this.usuarioDesativacaoPendenteId !== usuario.id) {
      this.usuarioDesativacaoPendenteId = usuario.id;
      this.mensagemFeedback = 'Clique novamente em desativar para confirmar.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';

    this.authService.desativarUsuario(usuario.id).subscribe({
      next: () => {
        this.usuarioDesativacaoPendenteId = '';
        this.mensagemFeedback = `${this.loginUsuario(usuario)} desativado com sucesso.`;
        this.carregarUsuarios();
        this.isCarregando = false;
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao desativar usuário.');
        this.usuarioDesativacaoPendenteId = '';
        this.isCarregando = false;
      }
    });
  }

  textoPerfil(role?: string): string {
    if (role === 'ADMIN') return 'Administrador';
    return 'Operador';
  }

  loginUsuario(usuario: UserResponseDTO): string {
    return usuario.login || '-';
  }
}
