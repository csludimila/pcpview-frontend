import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necessário para formulários
import { AuthService } from '../../../services/auth.service';
import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importamos aqui para funcionar o [(ngModel)]
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  
  // Criamos o objeto que vai guardar o que o usuário digitar
  novoUsuario: UserModel = {
    userName: '',
    email: '',
    password: '',
    role: 'USER'
  };

  constructor(private authService: AuthService) {}

  executarCadastro() {
    // Verificação simples antes de enviar
    if (this.novoUsuario.userName && this.novoUsuario.email) {
      this.authService.cadastrar(this.novoUsuario).subscribe({
        next: () => {
          alert("Usuário cadastrado com sucesso!");
          // Limpa os campos após o sucesso
          this.novoUsuario = { userName: '', email: '', password: '', role: 'USER' };
        },
        error: (err) => {
          if (err.status === 409) {
            alert("Erro: Este usuário ou e-mail já existe.");
          } else {
            alert("Erro ao conectar com o servidor.");
          }
        }
      });
    } else {
      alert("Por favor, preencha o nome e o e-mail.");
    }
  }
}