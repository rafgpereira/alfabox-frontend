import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'os',
        pathMatch: 'full',
      },
      {
        path: 'os',
        loadChildren: () =>
          import('./pages/service-order/service-order.routes').then((m) => m.SERVICE_ORDER_ROUTES),
      },
      {
        path: 'cadastro',
        loadChildren: () =>
          import('./pages/register/register.routes').then((m) => m.REGISTER_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'os',
  },
];
