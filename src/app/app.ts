import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.mostrarMenu = !event.urlAfterRedirects.includes('/login') && !event.urlAfterRedirects.includes('/cadastro');
        this.atualizarUsuarioLogado();
      }
    });
  }

  atualizarUsuarioLogado() {
    this.userEmail = localStorage.getItem('userEmail') || 'Colaborador';
    this.userRole = localStorage.getItem('userRole') || '';
  }

  get userLabel(): string {
    if (this.userRole === 'ADMIN') return 'Administrador';
    if (this.userRole) return 'Operador';
    return 'Colaborador';
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}
