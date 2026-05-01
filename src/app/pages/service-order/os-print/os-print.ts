import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ServiceOrderService } from '../../../shared/services/service-order.service';
import {
  ServiceOrderDetail,
  ServiceOrderDetailItem,
  ServiceOrderDetailPayment,
} from '../../../shared/models/service-order.model';
import { fromApiDate } from '../../../shared/utils/date.utils';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { CnpjFormatPipe } from '../../../shared/pipes/cnpj-format.pipe';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';

// Number of item rows to always show in the table (filled with blank rows if needed)
const ITEM_ROWS = 9;
// Payment table always shows exactly 3 rows
const PAYMENT_ROWS = 3;

@Component({
  selector: 'app-os-print',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PhoneFormatPipe],
  templateUrl: './os-print.html',
  styleUrl: './os-print.scss',
})
export class OsPrint implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly serviceOrderService = inject(ServiceOrderService);

  order: ServiceOrderDetail | null = null;

  /** Rows for the items table (padded with nulls to ITEM_ROWS) */
  get itemRows(): (ServiceOrderDetailItem | null)[] {
    if (!this.order) return Array(ITEM_ROWS).fill(null);
    const rows: (ServiceOrderDetailItem | null)[] = [...this.order.items];
    while (rows.length < ITEM_ROWS) rows.push(null);
    return rows;
  }

  /** Payments sorted ascending, padded to PAYMENT_ROWS */
get paymentRows(): (ServiceOrderDetailPayment | null)[] {
    if (!this.order) return Array(PAYMENT_ROWS).fill(null);

    // Clona o array e apenas inverte a ordem de DESC para ASC
    const rows: (ServiceOrderDetailPayment | null)[] = [...this.order.payments].reverse();

    // Preenche com linhas em branco até atingir o limite da página
    while (rows.length < PAYMENT_ROWS) {
      rows.push(null);
    }
    
    return rows;
  }

  ngOnInit(): void {
    // Try to reuse data passed via navigation state
    const stateData = history.state?.orderData as ServiceOrderDetail | undefined;
    if (stateData?.id) {
      this.order = stateData;
      this.schedulePrint();
    } else {
      const code = this.route.snapshot.paramMap.get('code')!;
      this.serviceOrderService.findByCode(code).subscribe({
        next: (data) => {
          this.order = data;
          this.schedulePrint();
        },
      });
    }
  }

  private schedulePrint(): void {
    setTimeout(() => window.print(), 400);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  toDate(apiDate: string): Date {
    return fromApiDate(apiDate);
  }

  formatDocument(): string {
    const client = this.order?.client;
    if (!client?.document) return '';
    if (client.personType === 'J') return new CnpjFormatPipe().transform(client.document);
    return new CpfFormatPipe().transform(client.document);
  }

  get documentLabel(): string {
    return this.order?.client.personType === 'J' ? 'CNPJ' : 'CPF';
  }

  formatPhones(): string {
    const phones = this.order?.client.phones ?? [];
    return phones.map((p) => new PhoneFormatPipe().transform(p.number)).join(' | ');
  }

  formatMethod(method: string, installments: number | null): string {
    const map: Record<string, string> = {
      DINHEIRO: 'Dinheiro',
      PIX: 'PIX',
      CARTAO_DEBITO: 'Débito',
      CARTAO_CREDITO: 'Crédito',
    };
    const label = map[method] ?? method;
    if (method === 'CARTAO_CREDITO' && installments && installments > 1) {
      return `${label} (${installments}x)`;
    }
    return label;
  }

  /** Brazilian long date: "Patos de Minas, 1 de abril de 2026." */
  get longDate(): string {
    if (!this.order) return '';
    const d = fromApiDate(this.order.orderDate);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  itemDescription(item: ServiceOrderDetailItem): string {
    const parts = [item.product?.name, item.details].filter(Boolean);
    return parts.join(' - ');
  }
}
