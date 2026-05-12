import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface CreateMaintenancePayload {
  type: 'NORMAL' | 'WARRANTY';
  clientId: string;
  serviceOrderId?: string | null;
  maintenanceDate: string;
  observation?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  complement?: string | null;
  city?: string | null;
  productDescription?: string | null;
  productAmount?: number | null;
  laborAmount?: number | null;
}

export interface MaintenanceResponse {
  id: string;
  code: string;
  type: string;
  maintenanceDate: string;
  totalAmount: number;
}

export type MaintenanceType = 'NORMAL' | 'WARRANTY';
export type MaintenancePaymentStatus = 'PAGO' | 'PARCIAL' | 'ABERTO';
export type MaintenanceExecutionStatus = 'PENDENTE' | 'CONCLUIDO';

export interface MaintenanceListItem {
  id: string;
  code: string;
  maintenanceDate: string;
  clientName: string;
  type: MaintenanceType;
  totalAmount: number;
  laborAmount: number;
  productAmount: number;
  paidAmount: number;
  paymentStatus: MaintenancePaymentStatus;
  executionStatus: MaintenanceExecutionStatus;
  assemblerNames: string | null;
}

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

  create(payload: CreateMaintenancePayload): Observable<MaintenanceResponse> {
    return this.http.post<MaintenanceResponse>(this.baseUrl, payload);
  }

  registerExecution(
    maintenanceId: string,
    payload: { executionDate: string; assemblerIds: string[] },
  ): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${maintenanceId}/execution`, payload);
  }

  createPayment(maintenanceId: string, payload: object): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${maintenanceId}/payments`, payload);
  }

  updatePayment(maintenanceId: string, paymentId: string, payload: object): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${maintenanceId}/payments/${paymentId}`, payload);
  }

  deletePayment(maintenanceId: string, paymentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${maintenanceId}/payments/${paymentId}`);
  }

  getPayments(maintenanceId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/${maintenanceId}/payments`);
  }
}
