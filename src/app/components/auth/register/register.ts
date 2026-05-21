import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { RegisterRequestDTO } from '../../../models/api.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  
  novoUsuario: RegisterRequestDTO = {
    userName: '',
    email: '',
    password: '',
    role: 'USER'
  };

  constructor(private authService: AuthService) {}

  executarCadastro() {
    if (this.novoUsuario.userName && this.novoUsuario.email && this.novoUsuario.password) {
      
      this.authService.registrar(this.novoUsuario).subscribe({
        next: () => {
          alert("Usuário cadastrado com sucesso!");
          this.novoUsuario = { userName: '', email: '', password: '', role: 'USER' };
        },
        error: (err: any) => {
          if (err.status === 409) {
            alert("Erro: Este usuário ou e-mail já existe.");
          } else {
            alert("Erro ao conectar com o servidor.");
            console.error(err);
          }
        }
      });
      
    } else {
      alert("Por favor, preencha todos os campos (Nome, E-mail e Senha).");
    }
  }
}