import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'os/:code/imprimir',
    loadComponent: () => import('./pages/service-order/os-print/os-print').then((m) => m.OsPrint),
    canActivate: [authGuard],
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
        path: 'manutencao',
        loadChildren: () =>
          import('./pages/maintenance/maintenance.routes').then((m) => m.MAINTENANCE_ROUTES),
      },
      {
        path: 'cadastro',
        loadChildren: () =>
          import('./pages/register/register.routes').then((m) => m.REGISTER_ROUTES),
      },
      {
        path: 'relatorios',
        loadChildren: () => import('./pages/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
        canActivate: [roleGuard('ADMIN')],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'os',
  },
];
