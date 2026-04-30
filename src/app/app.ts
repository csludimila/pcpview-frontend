<<<<<<< HEAD
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. Adicionamos RouterLink e RouterLinkActive aqui para os botões do menu funcionarem
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Os imports dos seus componentes continuam iguais
import { OrderFormComponent } from './components/order-form/order-form';
import { MachineListComponent } from './components/machine-list/machine-list';
=======

import { Component } from '@angular/core';

import { OpFormComponent } from './components/op-form/op-form'; 
>>>>>>> ccdc7bc7fb2ed023105334178c3e0e8634ce9a7b

@Component({
  selector: 'app-root',
  standalone: true,
<<<<<<< HEAD
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink,       // 2. Adicionado para suportar o link [routerLink] no HTML
    RouterLinkActive, // 3. Adicionado para destacar o botão da página atual
    OrderFormComponent, 
    MachineListComponent
  ],
=======
  // Aqui damos permissão para o chefe usar o seu formulário
  imports: [ OpFormComponent], 
>>>>>>> ccdc7bc7fb2ed023105334178c3e0e8634ce9a7b
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'pcpview-frontend';
}