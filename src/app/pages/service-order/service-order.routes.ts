import { Routes } from '@angular/router';

export const SERVICE_ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./service-order').then((m) => m.ServiceOrder),
  },
  {
    path: 'criar',
    loadComponent: () =>
      import('./create-service-order/create-service-order').then((m) => m.CreateServiceOrder),
  },
  {
    path: ':code',
    loadComponent: () =>
      import('./detail-service-order/detail-service-order').then((m) => m.DetailServiceOrder),
  },
];
