import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  ServiceOrderAddress,
  CreateServiceOrder,
  ServiceOrder,
} from '../models/service-order.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/service-orders`;

  create(payload: CreateServiceOrder): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(this.baseUrl, payload);
  }

  getAddressesByClient(clientId: string): Observable<ServiceOrderAddress[]> {
    return this.http.get<ServiceOrderAddress[]>(`${this.baseUrl}/addresses/by-client/${clientId}`);
  }
}
