import { Routes } from '@angular/router';

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
  },
  {
    path: 'montadores',
    loadComponent: () => import('./assembler/assembler').then((m) => m.Assembler),
  },
  {
    path: 'vendedores',
    loadComponent: () => import('./seller/seller').then((m) => m.Seller),
  },
];
