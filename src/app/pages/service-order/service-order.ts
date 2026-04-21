import { Component, inject } from '@angular/core';
import { SHARED_CRUD_IMPORTS } from '../../shared/constants/shared-crud-imports';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-order',
  imports: [...SHARED_CRUD_IMPORTS],
  templateUrl: './service-order.html',
  styleUrl: './service-order.scss',
})
export class ServiceOrder {
  private router = inject(Router);

  createNewOS() {
    this.router.navigate(['/os/criar']);
  }
}
