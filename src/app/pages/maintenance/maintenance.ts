import { Component, inject } from '@angular/core';
import { SHARED_CRUD_IMPORTS } from '../../shared/constants/shared-crud-imports';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maintenance',
  imports: [...SHARED_CRUD_IMPORTS],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class Maintenance {
  private router = inject(Router);
  createNewMaintenance() {
    this.router.navigate(['/manutencao/criar']);
  }
}
