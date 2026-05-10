import { Routes } from '@angular/router';

export const MAINTENANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./maintenance').then((m) => m.Maintenance),
  },
  {
    path: 'criar',
    loadComponent: () =>
      import('./create-maintenance/create-maintenance').then((m) => m.CreateMaintenance),
  },
];
