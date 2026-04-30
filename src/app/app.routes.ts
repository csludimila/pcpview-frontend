import { Routes } from '@angular/router';
import { OrderFormComponent } from './components/order-form/order-form';
import { MachineListComponent } from './components/machine-list/machine-list';

export const routes: Routes = [
  { path: 'escritorio', component: OrderFormComponent }, // Tela do Admin
  { path: 'fabrica', component: MachineListComponent },   // Tela do Operador
  { path: '', redirectTo: '/fabrica', pathMatch: 'full' } // Página inicial padrão
];