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
  {
    path: 'vendedores',
    loadComponent: () =>
      import('./service-orders-sellers/service-orders-sellers').then((m) => m.ServiceOrdersSellers),
  },
  {
    path: 'manutencao',
    loadComponent: () =>
      import('./maintenances-assemblers/maintenances-assemblers').then(
        (m) => m.MaintenancesAssemblers,
      ),
  },
];
