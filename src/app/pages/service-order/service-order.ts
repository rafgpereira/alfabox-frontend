import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SHARED_CRUD_IMPORTS } from '../../shared/constants/shared-crud-imports';
import { ServiceOrderService } from '../../shared/services/service-order.service';
import {
  ServiceOrderListItem,
  PaymentStatus,
  ExecutionStatus,
} from '../../shared/models/service-order.model';
import { fromApiDate, toApiDate } from '../../shared/utils/date.utils';
import { sumField, subtractCurrency } from '../../shared/utils/money.utils';
import { Router } from '@angular/router';
import { PaymentDialogComponent } from '../../shared/components/payment-dialog/payment-dialog';
import { ExecutionDialogComponent } from '../../shared/components/execution-dialog/execution-dialog';

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
    PaymentDialogComponent,
    ExecutionDialogComponent,
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

  // ── Filtros de data ───────────────────────────────────────────────────

  /** Data de início do filtro. */
  startDate: Date | null = null;

  /** Data de fim do filtro. */
  endDate: Date | null = null;

  /**
   * Mês selecionado no atalho de mês.
   * Reflete o mês do range apenas quando o range for exatamente um mês cheio;
   * caso contrário é null (range customizado).
   */
  selectedMonth: Date | null = null;

  /** Texto digitado na busca global. */
  searchText = '';

  /** Quando true, o datepicker fica desabilitado e a API é chamada apenas com search. */
  searchMode = false;

  // ── Busca rápida por código ───────────────────────────────────────────

  /** Código digitado no atalho de busca do cabeçalho. */
  codeSearchText = '';

  /** Regex de validação: 4 dígitos, traço, 1+ dígitos (ex.: 2504-1). */
  private readonly OS_CODE_PATTERN = /^\d{4}-\d+$/;

  // ── KPIs ──────────────────────────────────────────────────────────────

  totalVendido = 0;
  totalRecebido = 0;
  totalAReceber = 0;

  // ── Filtros locais da tabela ──────────────────────────────────────────

  paymentStatusOptions = [
    { label: 'PAGO', value: 'PAGO' },
    { label: 'PARCIAL', value: 'PARCIAL' },
    { label: 'ABERTO', value: 'ABERTO' },
  ];

  executionStatusOptions = [
    { label: 'PENDENTE', value: 'PENDENTE' },
    { label: 'PARCIAL', value: 'EM_ANDAMENTO' },
    { label: 'CONCLUÍDO', value: 'CONCLUIDO' },
  ];

  // ── Dialog Pagamento ──────────────────────────────────────────────────

  paymentDialogVisible = false;
  paymentDialogOrderId = '';
  paymentDialogOrderCode = '';
  paymentDialogClientName = '';
  paymentDialogOrderTotal = 0;
  paymentDialogPaidAmount = 0;

  // ── Dialog Execução ───────────────────────────────────────────────────

  executionDialogVisible = false;
  executionDialogOrderId = '';
  executionDialogOrderCode = '';
  executionDialogClientName = '';
  executionDialogOrderTotal = 0;
  executionDialogExecutedAmount = 0;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadCurrentMonth();
  }

  // ── Carregamento ──────────────────────────────────────────────────────

  createNewOS(): void {
    this.router.navigate(['/os/criar']);
  }

  navigateToDetail(code: string): void {
    this.router.navigate(['/os', code]);
  }

  printOrder(code: string): void {
    window.open(`/os/${code}/imprimir`, '_blank');
  }

  navigateByCode(): void {
    const code = this.codeSearchText.trim().toUpperCase();
    if (!code) return;
    if (!this.OS_CODE_PATTERN.test(code)) {
      // Feedback visual: limpa o campo sem navegar — formato inválido
      return;
    }
    this.router.navigate(['/os', code]);
  }

  onCodeSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.navigateByCode();
  }

  resetAll(): void {
    window.location.reload();
  }

  private loadCurrentMonth(): void {
    const now = new Date();
    this.applyMonth(now);
  }

  /**
   * Aplica um mês completo: seta startDate, endDate e selectedMonth,
   * depois dispara o load.
   */
  applyMonth(ref: Date): void {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    this.startDate = start;
    this.endDate = end;
    this.selectedMonth = start;
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

  /** Chamado quando o usuário seleciona um mês no atalho. */
  onMonthSelect(date: Date): void {
    this.applyMonth(date);
  }

  /** Chamado quando o usuário altera a data de início manualmente. */
  onStartDateChange(date: Date | null): void {
    this.startDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) {
      this.load({ startDate: toApiDate(this.startDate), endDate: toApiDate(this.endDate) });
    }
  }

  /** Chamado quando o usuário altera a data de fim manualmente. */
  onEndDateChange(date: Date | null): void {
    this.endDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) {
      this.load({ startDate: toApiDate(this.startDate), endDate: toApiDate(this.endDate) });
    }
  }

  /**
   * Verifica se o range atual coincide exatamente com um mês cheio.
   * Se sim, retorna o primeiro dia desse mês (para o month-picker mostrar ativo).
   * Caso contrário, retorna null.
   */
  private resolveSelectedMonth(): Date | null {
    if (!this.startDate || !this.endDate) return null;
    const s = this.startDate;
    const e = this.endDate;
    const isFirstDay = s.getDate() === 1;
    const isLastDay = e.getDate() === new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate();
    const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
    return isFirstDay && isLastDay && sameMonth ? new Date(s.getFullYear(), s.getMonth(), 1) : null;
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
    if (this.startDate && this.endDate) {
      this.load({ startDate: toApiDate(this.startDate), endDate: toApiDate(this.endDate) });
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
    this.totalVendido = sumField(rows, (r) => r.totalAmount);
    this.totalRecebido = sumField(rows, (r) => r.paidAmount);
    this.totalAReceber = subtractCurrency(this.totalVendido, this.totalRecebido);
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

  getExecutionStatusSeverity(status: ExecutionStatus): 'secondary' | 'info' | undefined {
    if (status === 'CONCLUIDO') return undefined;
    if (status === 'EM_ANDAMENTO') return 'info';
    return 'secondary';
  }

  getExecutionStatusLabel(status: ExecutionStatus): string {
    if (status === 'CONCLUIDO') return 'CONCLUÍDO';
    if (status === 'EM_ANDAMENTO') return 'PARCIAL';
    return 'PENDENTE';
  }

  // ── Ações de dialog ───────────────────────────────────────────────────

  openPaymentDialog(order: ServiceOrderRow): void {
    this.paymentDialogOrderId = order.id;
    this.paymentDialogOrderCode = order.code;
    this.paymentDialogClientName = order.clientName;
    this.paymentDialogOrderTotal = order.totalAmount;
    this.paymentDialogPaidAmount = order.paidAmount;
    this.paymentDialogVisible = true;
  }

  openExecutionDialog(order: ServiceOrderRow): void {
    this.executionDialogOrderId = order.id;
    this.executionDialogOrderCode = order.code;
    this.executionDialogClientName = order.clientName;
    this.executionDialogOrderTotal = order.totalAmount;
    this.executionDialogExecutedAmount = order.executedAmount;
    this.executionDialogVisible = true;
  }

  onDialogSaved(): void {
    // Recarrega a lista para atualizar KPIs e status
    if (this.searchMode && this.searchText.trim()) {
      this.load({ search: this.searchText.trim() });
    } else if (this.startDate && this.endDate) {
      this.load({ startDate: toApiDate(this.startDate), endDate: toApiDate(this.endDate) });
    } else {
      this.loadCurrentMonth();
    }
  }
}
