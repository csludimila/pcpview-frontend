import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { apiErrorMessage } from '../../../shared/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.authService.setToken(res.token);
        this.router.navigate(['/escritorio']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = apiErrorMessage(err, 'Falha na autenticação. Verifique e-mail e senha.');
        console.error('Erro no login:', err);
      }
    });
  }

  // Mantido por compatibilidade caso outro local use onLogin
  onLogin(): void {
    this.onSubmit();
  }
}