import { Routes } from '@angular/router';
import { MachineListComponent } from './components/machine-list/machine-list';
import { OrderFormComponent } from './components/order-form/order-form';
import { RegisterComponent } from './components/auth/register/register';
import { LoginComponent } from './components/auth/login/login';
import { ProductFormComponent } from './components/product-form/product-form';
import { OrderTrackingComponent } from '../order-tracking/order-tracking';
import { OpFormComponent } from './components/op-form/op-form';
import { adminGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },
  { path: 'planejamento', component: OrderFormComponent, canActivate: [adminGuard] },
  { path: 'escritorio', redirectTo: '/planejamento', pathMatch: 'full' },
  { path: 'operacao', component: OpFormComponent, canActivate: [authGuard] },
  { path: 'maquinas', component: MachineListComponent, canActivate: [authGuard] },
  { path: 'fabrica', redirectTo: '/maquinas', pathMatch: 'full' },
  { path: 'acompanhamento', component: OrderTrackingComponent, canActivate: [authGuard] },
  { path: 'produtos', component: ProductFormComponent, canActivate: [adminGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

