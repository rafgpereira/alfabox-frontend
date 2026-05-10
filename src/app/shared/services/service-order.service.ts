import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  ServiceOrderAddress,
  ServiceOrderLookup,
  UpdateAddress,
  UpdateItems,
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

  updateAddress(id: string, payload: UpdateAddress): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/address`, payload);
  }

  updateItems(id: string, payload: UpdateItems): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/items`, payload);
  }

  getAddressesByClient(clientId: string): Observable<ServiceOrderAddress[]> {
    return this.http.get<ServiceOrderAddress[]>(`${this.baseUrl}/addresses/by-client/${clientId}`);
  }

  lookup(clientId?: string, search?: string): Observable<ServiceOrderLookup[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId);
    if (search) params = params.set('search', search);
    return this.http.get<ServiceOrderLookup[]>(`${this.baseUrl}/lookup`, { params });
  }
}
