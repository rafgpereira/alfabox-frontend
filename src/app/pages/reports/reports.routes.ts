import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'montadores',
    pathMatch: 'full',
  },
  {
    path: 'montadores',
    loadComponent: () =>
      import('./executions-assemblers/executions-assemblers').then((m) => m.ExecutionsAssemblers),
  },
];
