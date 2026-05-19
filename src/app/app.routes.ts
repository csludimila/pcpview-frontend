import { Routes } from '@angular/router';
import { MachineListComponent } from './components/machine-list/machine-list';
import { OrderFormComponent } from './components/order-form/order-form';
import { RegisterComponent } from './components/auth/register/register';
import { LoginComponent } from './components/auth/login/login';
// 1. CORREÇÃO: Descomentado a linha de import
import { ProductFormComponent } from './components/product-form/product-form';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },
  { path: 'escritorio', component: OrderFormComponent },
  { path: 'fabrica', component: MachineListComponent },
  
  // 2. CORREÇÃO: Descomentado a linha da rota de produtos
  { path: 'produtos', component: ProductFormComponent }, 
  
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];