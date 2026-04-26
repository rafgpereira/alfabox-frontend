import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import {
  ServiceOrderPayment,
  CreateServiceOrderPayment,
  UpdateServiceOrderPayment,
} from '../models/service-order-payment.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrderPaymentService {
  private readonly http = inject(HttpClient);

  private url(orderId: string): string {
    return `${environment.apiUrl}/service-orders/${orderId}/payments`;
  }

  /**
   * Lista todos os pagamentos de uma OS.
   * GET /api/service-orders/:orderId/payments
   */
  findAll(orderId: string): Observable<ServiceOrderPayment[]> {
    return this.http.get<ServiceOrderPayment[]>(this.url(orderId));
  }

  /**
   * Cria um pagamento para uma OS.
   * POST /api/service-orders/:orderId/payments
   */
  create(orderId: string, payload: CreateServiceOrderPayment): Observable<ServiceOrderPayment> {
    return this.http.post<ServiceOrderPayment>(this.url(orderId), payload);
  }

  /**
   * Atualiza parcialmente um pagamento.
   * PATCH /api/service-orders/:orderId/payments/:id
   */
  update(
    orderId: string,
    id: string,
    payload: UpdateServiceOrderPayment,
  ): Observable<ServiceOrderPayment> {
    return this.http.patch<ServiceOrderPayment>(`${this.url(orderId)}/${id}`, payload);
  }

  /**
   * Remove um pagamento.
   * DELETE /api/service-orders/:orderId/payments/:id
   */
  delete(orderId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(orderId)}/${id}`);
  }
}
