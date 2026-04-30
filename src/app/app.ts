import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. Adicionamos RouterLink e RouterLinkActive aqui para os botões do menu funcionarem
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Os imports dos seus componentes continuam iguais
import { OrderFormComponent } from './components/order-form/order-form';
import { MachineListComponent } from './components/machine-list/machine-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink,       // 2. Adicionado para suportar o link [routerLink] no HTML
    RouterLinkActive, // 3. Adicionado para destacar o botão da página atual
    OrderFormComponent, 
    MachineListComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'pcpview-frontend';
}