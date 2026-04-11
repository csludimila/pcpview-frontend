
import { Component } from '@angular/core';

import { OpFormComponent } from './components/op-form/op-form'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // Aqui damos permissão para o chefe usar o seu formulário
  imports: [ OpFormComponent], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'pcpview-frontend';
}