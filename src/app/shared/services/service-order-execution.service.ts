import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  ServiceOrderExecution,
  CreateServiceOrderExecution,
  UpdateServiceOrderExecution,
} from '../models/service-order-execution.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrderExecutionService {
  private readonly http = inject(HttpClient);

  private url(orderId: string): string {
    return `${environment.apiUrl}/service-orders/${orderId}/executions`;
  }

  /**
   * Lista todas as execuções de uma OS.
   * GET /api/service-orders/:orderId/executions
   */
  findAll(orderId: string): Observable<ServiceOrderExecution[]> {
    return this.http.get<ServiceOrderExecution[]>(this.url(orderId));
  }

  /**
   * Cria uma execução para uma OS.
   * POST /api/service-orders/:orderId/executions
   */
  create(orderId: string, payload: CreateServiceOrderExecution): Observable<ServiceOrderExecution> {
    return this.http.post<ServiceOrderExecution>(this.url(orderId), payload);
  }

  /**
   * Atualiza parcialmente uma execução (data e valor apenas).
   * PATCH /api/service-orders/:orderId/executions/:id
   */
  update(
    orderId: string,
    id: string,
    payload: UpdateServiceOrderExecution,
  ): Observable<ServiceOrderExecution> {
    return this.http.patch<ServiceOrderExecution>(`${this.url(orderId)}/${id}`, payload);
  }

  /**
   * Remove uma execução.
   * DELETE /api/service-orders/:orderId/executions/:id
   */
  delete(orderId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(orderId)}/${id}`);
  }
}
