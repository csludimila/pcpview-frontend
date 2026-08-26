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
  usuarioResetSenhaId = '';
  senhasReset: Record<string, string> = {};
  resetSenhaCarregandoId = '';
  
  novoUsuario: RegisterRequestDTO = {
    userName: '',
    email: '',
    password: '',
    role: 'USER'
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.carregarUsuarios();
  }

  get emailValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.novoUsuario.email.trim());
  }

  get senhaValida(): boolean {
    return this.novoUsuario.password.trim().length >= 8;
  }

  get podeCadastrar(): boolean {
    return !!this.novoUsuario.userName.trim() &&
      this.emailValido &&
      this.senhaValida &&
      !!this.novoUsuario.role &&
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
      this.mensagemFeedback = 'A senha deve ter pelo menos 8 caracteres.';
      return;
    }

    this.isCarregando = true;
    this.authService.registrar({
      ...this.novoUsuario,
      userName: this.novoUsuario.userName.trim().toUpperCase(),
      email: this.novoUsuario.email.trim().toLowerCase()
    }).subscribe({
      next: () => {
        this.novoUsuario = { userName: '', email: '', password: '', role: 'USER' };
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
        if (this.usuarioResetSenhaId && !usuarios.some((usuario) => usuario.id === this.usuarioResetSenhaId)) {
          this.cancelarRedefinicaoSenha();
        }
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar usuários cadastrados.');
      }
    });
  }

  iniciarRedefinicaoSenha(usuario: UserResponseDTO) {
    if (!usuario.id) return;

    this.usuarioResetSenhaId = usuario.id;
    this.senhasReset[usuario.id] = '';
    this.mensagemFeedback = '';
  }

  cancelarRedefinicaoSenha() {
    this.usuarioResetSenhaId = '';
  }

  senhaResetValida(usuarioId?: string): boolean {
    if (!usuarioId) return false;
    return (this.senhasReset[usuarioId] || '').trim().length >= 8;
  }

  redefinirSenha(usuario: UserResponseDTO) {
    if (!usuario.id) return;

    const novaSenha = (this.senhasReset[usuario.id] || '').trim();
    if (novaSenha.length < 8) {
      this.mensagemFeedback = 'A nova senha deve ter pelo menos 8 caracteres.';
      return;
    }

    this.resetSenhaCarregandoId = usuario.id;
    this.mensagemFeedback = '';

    this.authService.redefinirSenha(usuario.id, { password: novaSenha }).subscribe({
      next: () => {
        this.senhasReset[usuario.id || ''] = '';
        this.usuarioResetSenhaId = '';
        this.resetSenhaCarregandoId = '';
        this.mensagemFeedback = `Senha de ${usuario.email || usuario.userName || 'usuário'} redefinida com sucesso.`;
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao redefinir senha.');
        this.resetSenhaCarregandoId = '';
      }
    });
  }

  textoPerfil(role?: string): string {
    if (role === 'ADMIN') return 'Administrador';
    return 'Operador';
  }
}
