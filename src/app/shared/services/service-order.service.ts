import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ServiceOrderAddress } from '../models/service-order.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/service-orders`;

  getAddressesByClient(clientId: string): Observable<ServiceOrderAddress[]> {
    return this.http.get<ServiceOrderAddress[]>(`${this.baseUrl}/addresses/by-client/${clientId}`);
  }
}
