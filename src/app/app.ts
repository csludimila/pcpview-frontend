import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { GlobalErrorService } from './shared/global-error.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule], 
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'pcpview-frontend';
  mostrarMenu: boolean = false;
  userEmail = '';
  userRole = '';
  erroGlobal = '';

  private readonly destroyRef = inject(DestroyRef);
  private readonly globalErrorService = inject(GlobalErrorService);

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.mostrarMenu = !event.urlAfterRedirects.includes('/login');
        this.atualizarUsuarioLogado();
      }
    });

    this.globalErrorService.mensagem$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mensagem) => {
        this.erroGlobal = mensagem;
      });
  }

  atualizarUsuarioLogado() {
    this.userEmail = this.authService.getUserEmail() || 'Colaborador';
    this.userRole = this.authService.getRole() || '';
  }

  get userLabel(): string {
    if (this.userRole === 'ADMIN') return 'Administrador';
    if (this.userRole) return 'Operador';
    return 'Colaborador';
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  fazerLogout() {
    this.authService.revogarSessao().subscribe({
      next: () => this.finalizarLogoutLocal(),
      error: () => this.finalizarLogoutLocal()
    });
  }

  limparErroGlobal() {
    this.globalErrorService.limpar();
  }

  private finalizarLogoutLocal() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
