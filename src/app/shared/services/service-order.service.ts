import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  ServiceOrderAddress,
  CreateServiceOrder,
  ServiceOrder,
  ServiceOrderListItem,
  ServiceOrderDetail,
} from '../models/service-order.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/service-orders`;

  findAll(filters?: {
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Observable<ServiceOrderListItem[]> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    if (filters?.search) params = params.set('search', filters.search);
    return this.http.get<ServiceOrderListItem[]>(this.baseUrl, { params });
  }

  findByCode(code: string): Observable<ServiceOrderDetail> {
    return this.http.get<ServiceOrderDetail>(`${this.baseUrl}/code/${code}`);
  }

  create(payload: CreateServiceOrder): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(this.baseUrl, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAddressesByClient(clientId: string): Observable<ServiceOrderAddress[]> {
    return this.http.get<ServiceOrderAddress[]>(`${this.baseUrl}/addresses/by-client/${clientId}`);
  }
}
