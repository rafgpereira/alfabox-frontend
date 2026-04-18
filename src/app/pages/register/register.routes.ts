import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'produtos',
    pathMatch: 'full',
  },
  {
    path: 'clientes',
    loadComponent: () => import('./customer/customer').then((m) => m.Customer),
  },
  {
    path: 'produtos',
    loadComponent: () => import('./product/product').then((m) => m.Product),
    //canActivate: [roleGuard('ADMIN')],
  },
  {
    path: 'montadores',
    loadComponent: () => import('./assembler/assembler').then((m) => m.Assembler),
    canActivate: [roleGuard('ADMIN')],
  },
  {
    path: 'vendedores',
    loadComponent: () => import('./seller/seller').then((m) => m.Seller),
    canActivate: [roleGuard('ADMIN')],
  },
];
