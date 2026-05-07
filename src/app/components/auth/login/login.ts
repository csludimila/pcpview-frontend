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


  login() {
    if (!this.credenciais.email || !this.credenciais.password) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    this.authService.login(this.credenciais).subscribe({
      next: (res) => {
        this.authService.setToken(res.token);
        console.log('Token recebido:', res.token);
        this.router.navigate(['/escritorio']);
      },
      error: (err) => {
        console.error('Erro no login:', err);

        alert('Falha na autenticação. Verifique seu e-mail e senha.');
      }
    });
  }
}