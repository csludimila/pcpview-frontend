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
  credenciais = { email: '', password: '' };

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }


  fazerLogin() {
    this.authService.login(this.credenciais).subscribe({
      next: (res) => {
        // De acordo com o LoginResponseDTO, o Java retorna { token: "..." }
        this.authService.setToken(res.token);

        alert('Login realizado com sucesso!');

        // Redireciona para a tela inicial do sistema (Escritório)
        this.router.navigate(['/escritorio']);
      },
      error: (err) => {
        console.error('Erro no login:', err);
        alert('Falha na autenticação. Verifique seu e-mail e senha.');
      }
    });
  }
}