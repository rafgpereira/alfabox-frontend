import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SHARED_CRUD_IMPORTS } from '../../shared/constants/shared-crud-imports';
import {
  MaintenanceService,
  MaintenanceListItem,
  MaintenancePaymentStatus,
  MaintenanceExecutionStatus,
  MaintenanceType,
} from '../../shared/services/maintenance.service';
import { MaintenanceFilterStateService } from '../../shared/services/maintenance-filter-state.service';
import { fromApiDate, toApiDate } from '../../shared/utils/date.utils';
import { sumField, subtractCurrency, fromCents, toCents } from '../../shared/utils/money.utils';
import { Router } from '@angular/router';

/** Linha da tabela — maintenanceDate convertido para Date para filtros locais do PrimeNG.
 *  totalAmount e paymentStatus são null para manutenções de GARANTIA (não exibidos na tabela). */
export interface MaintenanceRow extends Omit<
  MaintenanceListItem,
  'maintenanceDate' | 'totalAmount' | 'paymentStatus'
> {
  maintenanceDate: Date;
  /** Null para WARRANTY — linha exibe vazio e não aparece em filtros de status de pagamento. */
  totalAmount: number | null;
  /** Null para WARRANTY — linha exibe vazio e não aparece em filtros de status de pagamento. */
  paymentStatus: MaintenancePaymentStatus | null;
}

@Component({
  selector: 'app-maintenance',
  imports: [
    ...SHARED_CRUD_IMPORTS,
    CurrencyPipe,
    DatePipe,
    ProgressBarModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class Maintenance implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly filterState = inject(MaintenanceFilterStateService);

  // ── Estado ────────────────────────────────────────────────────────────

  maintenances: MaintenanceRow[] = [];
  loading = false;

  // ── Filtros de data ───────────────────────────────────────────────────

  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedMonth: Date | null = null;

  // ── Busca global ──────────────────────────────────────────────────────

  searchText = '';
  searchMode = false;

  // ── KPIs — linha 1 ───────────────────────────────────────────────────

  totalManutencoes = 0; // soma de totalAmount (WARRANTY conta como 0)
  totalRecebido = 0;
  totalAReceber = 0;

  // ── KPIs — linha 2 ───────────────────────────────────────────────────

  totalProdutos = 0;
  totalMaoDeObra = 0;
  totalVidracaria = 0; // produtos + 50% mão de obra
  totalMontadores = 0; // 50% mão de obra

  // ── Filtros locais da tabela ──────────────────────────────────────────

  typeOptions = [
    { label: 'PADRÃO', value: 'NORMAL' as MaintenanceType },
    { label: 'GARANTIA', value: 'WARRANTY' as MaintenanceType },
  ];

  paymentStatusOptions = [
    { label: 'PAGO', value: 'PAGO' as MaintenancePaymentStatus },
    { label: 'PARCIAL', value: 'PARCIAL' as MaintenancePaymentStatus },
    { label: 'ABERTO', value: 'ABERTO' as MaintenancePaymentStatus },
  ];

  executionStatusOptions = [
    { label: 'PENDENTE', value: 'PENDENTE' as MaintenanceExecutionStatus },
    { label: 'CONCLUÍDO', value: 'CONCLUIDO' as MaintenanceExecutionStatus },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    const saved = this.filterState.restore();
    if (saved) {
      this.startDate = saved.startDate;
      this.endDate = saved.endDate;
      this.selectedMonth = saved.selectedMonth;
      this.searchText = saved.searchText;
      this.searchMode = saved.searchMode;

      if (this.searchMode && this.searchText.trim()) {
        this.load({ search: this.searchText.trim() });
      } else if (this.startDate && this.endDate) {
        this.load({ startDate: toApiDate(this.startDate), endDate: toApiDate(this.endDate) });
      } else {
        this.loadCurrentMonth();
      }
    } else {
      this.loadCurrentMonth();
    }
  }

  ngOnDestroy(): void {
    this.filterState.save({
      startDate: this.startDate,
      endDate: this.endDate,
      selectedMonth: this.selectedMonth,
      searchText: this.searchText,
      searchMode: this.searchMode,
    });
  }

  // ── Navegação ─────────────────────────────────────────────────────────

  createNewMaintenance(): void {
    this.router.navigate(['/manutencao/criar']);
  }

  // ── Carregamento ──────────────────────────────────────────────────────

  private loadCurrentMonth(): void {
    this.applyMonth(new Date());
  }

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
    this.maintenanceService.findAll(filters).subscribe({
      next: (items) => {
        this.maintenances = items.map((item) => ({
          ...item,
          maintenanceDate: fromApiDate(item.maintenanceDate),
          totalAmount: item.type === 'WARRANTY' ? null : item.totalAmount,
          paymentStatus: item.type === 'WARRANTY' ? null : item.paymentStatus,
        }));
        this.calculateKpis(this.maintenances);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // ── Handlers de filtro de data ────────────────────────────────────────

  onMonthSelect(date: Date): void {
    this.applyMonth(date);
  }

  onStartDateChange(date: Date | null): void {
    this.startDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) {
      this.load({ startDate: toApiDate(this.startDate), endDate: toApiDate(this.endDate) });
    }
  }

  onEndDateChange(date: Date | null): void {
    this.endDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) {
      this.load({ startDate: toApiDate(this.startDate), endDate: toApiDate(this.endDate) });
    }
  }

  private resolveSelectedMonth(): Date | null {
    if (!this.startDate || !this.endDate) return null;
    const s = this.startDate;
    const e = this.endDate;
    const isFirstDay = s.getDate() === 1;
    const isLastDay = e.getDate() === new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate();
    const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
    return isFirstDay && isLastDay && sameMonth ? new Date(s.getFullYear(), s.getMonth(), 1) : null;
  }

  resetAll(): void {
    this.filterState.clear();
    sessionStorage.removeItem('maintenance-list-filters');
    window.location.reload();
  }

  // ── Handlers de busca ─────────────────────────────────────────────────

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

  calculateKpis(rows: MaintenanceRow[]): void {
    // Linha 1
    this.totalManutencoes = sumField(rows, (r) => r.totalAmount ?? 0);
    this.totalRecebido = sumField(rows, (r) => r.paidAmount);
    this.totalAReceber = subtractCurrency(this.totalManutencoes, this.totalRecebido);

    // Linha 2
    this.totalProdutos = sumField(rows, (r) => r.productAmount);
    this.totalMaoDeObra = sumField(rows, (r) => r.laborAmount);

    // 50% da mão de obra em centavos → metades exatas por arredondamento
    const maoDeObraEmCentavos = toCents(this.totalMaoDeObra);
    const metadeMontadoresCents = Math.round(maoDeObraEmCentavos / 2);
    const metadeVidracariaCents = maoDeObraEmCentavos - metadeMontadoresCents;

    this.totalMontadores = fromCents(metadeMontadoresCents);
    this.totalVidracaria = fromCents(toCents(this.totalProdutos) + metadeVidracariaCents);
  }

  onTableFilter(event: { filteredValue?: MaintenanceRow[] | null }): void {
    this.calculateKpis(event.filteredValue ?? this.maintenances);
  }

  get recebidoPercentage(): number {
    if (!this.totalManutencoes) return 0;
    return Math.min(100, Math.round((this.totalRecebido / this.totalManutencoes) * 100));
  }

  get aReceberPercentage(): number {
    if (!this.totalManutencoes) return 0;
    return Math.min(100, Math.round((this.totalAReceber / this.totalManutencoes) * 100));
  }

  // ── Helpers de display ────────────────────────────────────────────────

  getTypeLabel(type: MaintenanceType): string {
    return type === 'WARRANTY' ? 'GARANTIA' : 'PADRÃO';
  }

  getTypeSeverity(type: MaintenanceType): 'info' | undefined {
    return type === 'WARRANTY' ? 'info' : undefined;
  }

  getPaymentStatusSeverity(status: MaintenancePaymentStatus): 'success' | 'warn' | 'danger' {
    if (status === 'PAGO') return 'success';
    if (status === 'PARCIAL') return 'warn';
    return 'danger';
  }

  getExecutionStatusSeverity(status: MaintenanceExecutionStatus): 'warn' | 'success' {
    return status === 'CONCLUIDO' ? 'success' : 'warn';
  }

  getExecutionStatusLabel(status: MaintenanceExecutionStatus): string {
    return status === 'CONCLUIDO' ? 'CONCLUÍDO' : 'PENDENTE';
  }
}
