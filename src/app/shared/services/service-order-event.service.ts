import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ServiceOrderDetailEvent } from '../models/service-order.model';

export interface CreateServiceOrderEvent {
  eventDate: string; // YYYY-MM-DD
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceOrderEventService {
  private readonly http = inject(HttpClient);

  private url(orderId: string): string {
    return `${environment.apiUrl}/service-orders/${orderId}/events`;
  }

  /**
   * Cria uma ocorrência para uma OS.
   * POST /api/service-orders/:orderId/events
   */
  create(orderId: string, payload: CreateServiceOrderEvent): Observable<ServiceOrderDetailEvent> {
    return this.http.post<ServiceOrderDetailEvent>(this.url(orderId), payload);
  }

  /**
   * Remove uma ocorrência.
   * DELETE /api/service-orders/:orderId/events/:id
   */
  delete(orderId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(orderId)}/${id}`);
  }
}
