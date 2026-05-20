import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  credenciais = {
    email: '',
    password: ''
  };

  // CONSTRUTOR CORRIGIDO: Apenas com as injeções necessárias, sem variáveis perdidas
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  onLogin(): void {
    if (this.credenciais.email && this.credenciais.password) {
      
      this.authService.login(this.credenciais).subscribe({
        next: (res: any) => {
          this.authService.setToken(res.token);
          console.log('Token recebido:', res.token);
          
          alert('Login efetuado com sucesso!');
          this.router.navigate(['/escritorio']);
        },
        error: (err: any) => {
          console.error('Erro no login:', err);
          alert('Falha na autenticação. Verifique e-mail e senha.');
        }
      });

    } else {
      alert('Por favor, preencha todos os campos.');
    }
  }
}