import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  CreateMaintenance,
  UpdateMaintenanceAddress,
  UpdateMaintenanceServiceOrder,
  MaintenanceResponse,
  MaintenanceListItem,
  MaintenanceDetail,
} from '../models/maintenance.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/maintenances`;

  findAll(filters: {
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Observable<MaintenanceListItem[]> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<MaintenanceListItem[]>(this.baseUrl, { params });
  }

  findByCode(code: string): Observable<MaintenanceDetail> {
    return this.http.get<MaintenanceDetail>(`${this.baseUrl}/${code}`);
  }

  create(payload: CreateMaintenance): Observable<MaintenanceResponse> {
    return this.http.post<MaintenanceResponse>(this.baseUrl, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updateAddress(id: string, payload: UpdateMaintenanceAddress): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/address`, payload);
  }

  updateServiceOrder(id: string, payload: UpdateMaintenanceServiceOrder): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/service-order`, payload);
  }

  registerExecution(
    id: string,
    payload: { executionDate: string; assemblerIds: string[] },
  ): Observable<MaintenanceResponse> {
    return this.http.patch<MaintenanceResponse>(`${this.baseUrl}/${id}/execution`, payload);
  }

  deleteExecution(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/execution`);
  }
}
