import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/maintenances`;

  create(payload: CreateMaintenancePayload): Observable<MaintenanceResponse> {
    return this.http.post<MaintenanceResponse>(this.baseUrl, payload);
  }
}
