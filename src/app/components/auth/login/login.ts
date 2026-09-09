import { Component, inject } from '@angular/core';
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
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  
  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        const role = this.authService.getRole();
        this.router.navigate([role === 'ADMIN' ? '/planejamento' : '/operacao']);
      },
      error: (err) => {
        this.isLoading = false;
        const mensagem = apiErrorMessage(err, 'Credenciais inválidas. Verifique o login e a senha.');
        this.errorMessage = mensagem.includes('UserDetailsService returned null')
          ? 'Credenciais inválidas. Verifique o login e a senha.'
          : mensagem;
      }
    });
  }
}
