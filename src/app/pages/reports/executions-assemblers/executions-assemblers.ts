import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';
import {
  ReportsService,
  ExecutionReportItem,
  ExecutionsReportResponse,
} from '../../../shared/services/reports.service';
import { AssemblerService } from '../../../shared/services/assembler.service';
import { Assembler } from '../../../shared/models/assembler.model';
import { toApiDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-executions-assemblers',
  imports: [...SHARED_CRUD_IMPORTS, CurrencyPipe, DatePipe],
  templateUrl: './executions-assemblers.html',
  styleUrl: './executions-assemblers.scss',
})
export class ExecutionsAssemblers implements OnInit {
  private readonly router = inject(Router);
  private readonly reportsService = inject(ReportsService);
  private readonly assemblerService = inject(AssemblerService);

  // ── Estado ────────────────────────────────────────────────────────────

  report: ExecutionsReportResponse | null = null;
  executions: ExecutionReportItem[] = [];
  assemblers: Assembler[] = [];
  loading = false;

  // ── Filtros de data ───────────────────────────────────────────────────

  startDate: Date | null = null;
  endDate: Date | null = null;

  /**
   * Mês selecionado no atalho de mês.
   * Reflete o mês do range apenas quando o range for exatamente um mês cheio;
   * caso contrário é null (range customizado).
   */
  selectedMonth: Date | null = null;

  // ── Filtro de montador ────────────────────────────────────────────────

  selectedAssemblerId: string | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.assemblerService.findAll().subscribe((list) => {
      this.assemblers = list;
    });
    this.loadCurrentMonth();
  }

  // ── Carregamento ──────────────────────────────────────────────────────

  private loadCurrentMonth(): void {
    const now = new Date();
    this.applyMonth(now);
  }

  applyMonth(ref: Date): void {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    this.startDate = start;
    this.endDate = end;
    this.selectedMonth = start;
    this.load();
  }

  private load(): void {
    if (!this.startDate || !this.endDate) return;
    this.loading = true;
    this.reportsService
      .getExecutionsReport({
        startDate: toApiDate(this.startDate),
        endDate: toApiDate(this.endDate),
        assemblerId: this.selectedAssemblerId ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.report = res;
          this.executions = res.executions;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  // ── Handlers de filtro ────────────────────────────────────────────────

  onMonthSelect(date: Date): void {
    this.applyMonth(date);
  }

  onStartDateChange(date: Date | null): void {
    this.startDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) {
      this.load();
    }
  }

  onEndDateChange(date: Date | null): void {
    this.endDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) {
      this.load();
    }
  }

  onAssemblerChange(): void {
    this.load();
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

  // ── Navegação ─────────────────────────────────────────────────────────

  navigateToOrder(code: string): void {
    this.router.navigate(['/os', code]);
  }
}
