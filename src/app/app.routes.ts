
import { Routes } from '@angular/router';
import { MachineListComponent } from './components/machine-list/machine-list';
import { OrderFormComponent } from './components/order-form/order-form';

export const routes: Routes = [
  { path: 'escritorio', component: OrderFormComponent },
  { path: 'fabrica', component: MachineListComponent },
  { path: '', redirectTo: '/escritorio', pathMatch: 'full' }
];