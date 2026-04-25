import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SHARED_CRUD_IMPORTS } from '../../shared/constants/shared-crud-imports';
import { ServiceOrderService } from '../../shared/services/service-order.service';
import { ServiceOrderListItem, PaymentStatus } from '../../shared/models/service-order.model';
import { fromApiDate, toApiDate } from '../../shared/utils/date.utils';
import { Router } from '@angular/router';

/** Linha da tabela — datas convertidas para Date para os filtros locais do PrimeNG. */
export interface ServiceOrderRow extends Omit<
  ServiceOrderListItem,
  'orderDate' | 'lastPaymentDate'
> {
  orderDate: Date;
  lastPaymentDate: Date | null;
}

@Component({
  selector: 'app-service-order',
  imports: [
    ...SHARED_CRUD_IMPORTS,
    CurrencyPipe,
    DatePipe,
    ProgressBarModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './service-order.html',
  styleUrl: './service-order.scss',
})
export class ServiceOrder implements OnInit {
  private readonly router = inject(Router);
  private readonly serviceOrderService = inject(ServiceOrderService);

  // ── Estado ────────────────────────────────────────────────────────────

  orders: ServiceOrderRow[] = [];
  loading = false;

  // ── Filtros ───────────────────────────────────────────────────────────

  /** Range de datas selecionado no p-datepicker. */
  dateRange: Date[] = [];

  /** Texto digitado na busca global. */
  searchText = '';

  /** Quando true, o datepicker fica desabilitado e a API é chamada apenas com search. */
  searchMode = false;

  // ── KPIs ──────────────────────────────────────────────────────────────

  totalVendido = 0;
  totalRecebido = 0;
  totalAReceber = 0;

  // ── Filtros locais da tabela ──────────────────────────────────────────

  paymentStatusOptions = [
    { label: 'Pago', value: 'PAGO' },
    { label: 'Parcial', value: 'PARCIAL' },
    { label: 'Aberto', value: 'ABERTO' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadCurrentMonth();
  }

  // ── Carregamento ──────────────────────────────────────────────────────

  createNewOS(): void {
    this.router.navigate(['/os/criar']);
  }

  private loadCurrentMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.dateRange = [start, end];
    this.load({ startDate: toApiDate(start), endDate: toApiDate(end) });
  }

  private load(filters: { startDate?: string; endDate?: string; search?: string }): void {
    this.loading = true;
    this.serviceOrderService.findAll(filters).subscribe({
      next: (items) => {
        this.orders = items.map((item) => ({
          ...item,
          orderDate: fromApiDate(item.orderDate),
          lastPaymentDate: item.lastPaymentDate ? fromApiDate(item.lastPaymentDate) : null,
        }));
        this.calculateTotals(this.orders);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // ── Handlers de filtro ────────────────────────────────────────────────

  onDateRangeChange(dates: Date[] | null): void {
    this.dateRange = dates ?? [];
    const [start, end] = this.dateRange;
    if (start && end) {
      this.load({ startDate: toApiDate(start), endDate: toApiDate(end) });
    }
  }

  submitSearch(): void {
    const q = this.searchText.trim();
    if (!q) {
      this.clearSearch();
      return;
    }
    this.searchMode = true;
    this.load({ search: q });
  }

  clearSearch(): void {
    this.searchText = '';
    this.searchMode = false;
    const [start, end] = this.dateRange;
    if (start && end) {
      this.load({ startDate: toApiDate(start), endDate: toApiDate(end) });
    } else {
      this.loadCurrentMonth();
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.submitSearch();
  }

  onSearchChange(value: string): void {
    if (!value) this.clearSearch();
  }

  // ── KPIs ──────────────────────────────────────────────────────────────

  calculateTotals(rows: ServiceOrderRow[]): void {
    this.totalVendido = rows.reduce((acc, r) => acc + r.totalAmount, 0);
    this.totalRecebido = rows.reduce((acc, r) => acc + r.paidAmount, 0);
    this.totalAReceber = this.totalVendido - this.totalRecebido;
  }

  onTableFilter(event: { filteredValue?: ServiceOrderRow[] | null }): void {
    this.calculateTotals(event.filteredValue ?? this.orders);
  }

  get paidPercentage(): number {
    if (!this.totalVendido) return 0;
    return Math.min(100, Math.round((this.totalRecebido / this.totalVendido) * 100));
  }

  get receivablePercentage(): number {
    if (!this.totalVendido) return 0;
    return Math.min(100, Math.round((this.totalAReceber / this.totalVendido) * 100));
  }

  // ── Helpers de display ────────────────────────────────────────────────

  getPaymentStatusSeverity(status: PaymentStatus): 'success' | 'warn' | 'danger' {
    if (status === 'PAGO') return 'success';
    if (status === 'PARCIAL') return 'warn';
    return 'danger';
  }
}
