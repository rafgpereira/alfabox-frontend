import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';
import {
  ReportsService,
  SaleListItem,
  SalesChartResponse,
  SalesReportResponse,
  SaleType,
} from '../../../shared/services/reports.service';
import { toApiDate } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-sales',
  imports: [...SHARED_CRUD_IMPORTS, CurrencyPipe, DatePipe, ChartModule],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
})
export class Sales implements OnInit {
  private readonly router = inject(Router);
  private readonly reportsService = inject(ReportsService);

  // ── Estado — Card 1 (Registros do Período) ────────────────────────────

  report: SalesReportResponse | null = null;
  list: SaleListItem[] = [];
  loading = false;

  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedMonth: Date | null = null;

  revenueChartData: object | null = null;
  revenueChartOptions: object | null = null;
  volumeChartData: object | null = null;
  volumeChartOptions: object | null = null;

  // ── Estado — Card 2 (Distribuição por Dia) ────────────────────────────

  dailyStartDate: Date | null = null;
  dailyEndDate: Date | null = null;
  dailySelectedMonth: Date | null = null;

  dailyBarData: object | null = null;
  dailyBarOptions: object | null = null;
  dailyBarLoading = false;

  // ── Estado — Card 3 (Distribuição por Mês) ────────────────────────────

  monthlyStartMonth: Date | null = null;
  monthlyEndMonth: Date | null = null;
  monthlySelectedYear: Date | null = null;

  // Limites para os month-pickers
  monthlyStartMaxDate: Date | null = null;
  monthlyEndMinDate: Date | null = null;

  monthlyBarData: object | null = null;
  monthlyBarOptions: object | null = null;
  monthlyBarLoading = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initChartOptions();
    this.initBarChartOptions();
    this.loadCurrentMonth();
    this.initDailyChart();
    this.initMonthlyChart();
  }

  // ── Card 1: Carregamento ──────────────────────────────────────────────

  private loadCurrentMonth(): void {
    this.applyMonth(new Date());
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
      .getSalesReport({
        startDate: toApiDate(this.startDate),
        endDate: toApiDate(this.endDate),
      })
      .subscribe({
        next: (res) => {
          this.report = res;
          this.list = res.list;
          this.updateChartData(res);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  // ── Card 1: Opções de gráfico ─────────────────────────────────────────

  private initChartOptions(): void {
    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--p-text-color').trim();

    const legendConfig = {
      position: 'right',
      labels: { color: textColor, padding: 16, font: { size: 12 } },
    };

    this.revenueChartOptions = {
      cutout: '65%',
      maintainAspectRatio: false,
      plugins: {
        legend: legendConfig,
        tooltip: {
          callbacks: {
            label: (ctx: { label: string; formattedValue: string }) =>
              ` ${ctx.label}: R$ ${ctx.formattedValue}`,
          },
        },
      },
    };

    this.volumeChartOptions = {
      cutout: '65%',
      maintainAspectRatio: false,
      plugins: {
        legend: legendConfig,
        tooltip: {
          callbacks: {
            label: (ctx: { label: string; raw: number }) => ` ${ctx.label}: ${ctx.raw}`,
          },
        },
      },
    };
  }

  private updateChartData(res: SalesReportResponse): void {
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--p-primary-500').trim();
    const cyan = style.getPropertyValue('--p-cyan-500').trim();
    const orange = style.getPropertyValue('--p-orange-500').trim();

    const revenueData = res.charts.revenueDoughnut.datasets[0]?.data ?? [];
    const hasRevenue = revenueData.some((v) => v > 0);

    this.revenueChartData = hasRevenue
      ? {
          labels: res.charts.revenueDoughnut.labels,
          datasets: [
            {
              data: revenueData,
              backgroundColor: [primary, cyan],
              hoverBackgroundColor: [primary, cyan],
              borderWidth: 2,
            },
          ],
        }
      : null;

    const volumeData = res.charts.volumeDoughnut.datasets[0]?.data ?? [];
    const hasVolume = volumeData.some((v) => v > 0);

    this.volumeChartData = hasVolume
      ? {
          labels: res.charts.volumeDoughnut.labels,
          datasets: [
            {
              data: volumeData,
              backgroundColor: [primary, cyan, orange],
              hoverBackgroundColor: [primary, cyan, orange],
              borderWidth: 2,
            },
          ],
        }
      : null;
  }

  // ── Card 1: Handlers de filtro ────────────────────────────────────────

  onMonthSelect(date: Date): void {
    this.applyMonth(date);
  }

  onStartDateChange(date: Date | null): void {
    this.startDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) this.load();
  }

  onEndDateChange(date: Date | null): void {
    this.endDate = date;
    this.selectedMonth = this.resolveSelectedMonth();
    if (this.startDate && this.endDate) this.load();
  }

  private resolveSelectedMonth(): Date | null {
    if (!this.startDate || !this.endDate) return null;
    const s = this.startDate;
    const e = this.endDate;
    const firstDay = new Date(s.getFullYear(), s.getMonth(), 1);
    const lastDay = new Date(s.getFullYear(), s.getMonth() + 1, 0);
    return s.getTime() === firstDay.getTime() && e.getTime() === lastDay.getTime()
      ? firstDay
      : null;
  }

  // ── Cards 2 & 3: Opções de gráfico de barras ──────────────────────────

  private initBarChartOptions(): void {
    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--p-text-color').trim();
    const textMuted = style.getPropertyValue('--p-text-muted-color').trim();
    const borderColor = style.getPropertyValue('--p-surface-200').trim();

    const options = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, padding: 16, font: { size: 12 } },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx: { dataset: { label: string }; raw: number }) =>
              ` ${ctx.dataset.label}: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(ctx.raw)}`,
            footer: (items: Array<{ raw: number }>) => {
              const total = items.reduce((sum, item) => sum + Number(item.raw), 0);
              return `Total: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(total)}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: textMuted },
          grid: { color: borderColor },
        },
        y: {
          stacked: true,
          ticks: {
            color: textMuted,
            callback: (value: number | string) => {
              const n = Number(value);
              if (n === 0) return 'R$ 0';
              if (n >= 1_000_000) {
                const m = n / 1_000_000;
                return `R$ ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
              }
              if (n >= 1000) {
                const k = n / 1000;
                return `R$ ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
              }
              return `R$ ${n.toFixed(0)}`;
            },
          },
          grid: { color: borderColor },
        },
      },
    };

    this.dailyBarOptions = options;
    this.monthlyBarOptions = { ...options };
  }

  private buildSalesBarChartData(res: SalesChartResponse): object | null {
    if (res.datasets.length === 0) return null;

    const style = getComputedStyle(document.documentElement);
    const colorMap: Record<string, string> = {
      OS: style.getPropertyValue('--p-primary-500').trim(),
      Manutenção: style.getPropertyValue('--p-cyan-500').trim(),
    };

    return {
      labels: res.labels,
      datasets: res.datasets.map((ds) => ({
        type: 'bar',
        label: ds.label,
        backgroundColor: colorMap[ds.label] ?? style.getPropertyValue('--p-primary-500').trim(),
        data: ds.data,
      })),
    };
  }

  // ── Card 2: Daily chart — inicialização e carregamento ────────────────

  /**
   * Padrão: fim = hoje, início = hoje − 30 dias (último mês corrido).
   * Não é um mês calendário completo, por isso dailySelectedMonth = null.
   */
  private initDailyChart(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.dailyEndDate = today;
    this.dailyStartDate = thirtyDaysAgo;
    this.dailySelectedMonth = null;
    this.loadDailyChart();
  }

  private loadDailyChart(): void {
    if (!this.dailyStartDate || !this.dailyEndDate) return;
    this.dailyBarLoading = true;
    this.reportsService
      .getSalesChartDaily({
        startDate: toApiDate(this.dailyStartDate),
        endDate: toApiDate(this.dailyEndDate),
      })
      .subscribe({
        next: (res) => {
          this.dailyBarData = this.buildSalesBarChartData(res);
          this.dailyBarLoading = false;
        },
        error: () => {
          this.dailyBarData = null;
          this.dailyBarLoading = false;
        },
      });
  }

  // ── Card 2: Daily chart — handlers ────────────────────────────────────

  applyDailyMonth(ref: Date): void {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    this.dailyStartDate = start;
    this.dailyEndDate = end;
    this.dailySelectedMonth = start;
    this.loadDailyChart();
  }

  onDailyMonthSelect(date: Date): void {
    this.applyDailyMonth(date);
  }

  onDailyStartDateChange(date: Date | null): void {
    this.dailyStartDate = date;
    this.dailySelectedMonth = this.resolveSelectedDailyMonth();
    if (this.dailyStartDate && this.dailyEndDate) this.loadDailyChart();
  }

  onDailyEndDateChange(date: Date | null): void {
    this.dailyEndDate = date;
    this.dailySelectedMonth = this.resolveSelectedDailyMonth();
    if (this.dailyStartDate && this.dailyEndDate) this.loadDailyChart();
  }

  private resolveSelectedDailyMonth(): Date | null {
    if (!this.dailyStartDate || !this.dailyEndDate) return null;
    const s = this.dailyStartDate;
    const e = this.dailyEndDate;
    const firstDay = new Date(s.getFullYear(), s.getMonth(), 1);
    const lastDay = new Date(s.getFullYear(), s.getMonth() + 1, 0);
    return s.getTime() === firstDay.getTime() && e.getTime() === lastDay.getTime()
      ? firstDay
      : null;
  }

  // ── Card 3: Monthly chart — inicialização e carregamento ──────────────

  /**
   * Padrão: fim = mês atual, início = mesmo mês do ano anterior.
   * Exibe 13 meses, permitindo comparar o mês corrente com o mesmo mês
   * do ano passado lado a lado no gráfico.
   */
  private initMonthlyChart(): void {
    const now = new Date();
    this.monthlyEndMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.monthlyStartMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    this.monthlySelectedYear = null; // 13 meses não é um ano calendário completo
    this.updateMonthlyConstraints();
    this.loadMonthlyChart();
  }

  /**
   * Recalcula limites dos month-pickers: início ≤ fim.
   */
  private updateMonthlyConstraints(): void {
    this.monthlyStartMaxDate = this.monthlyEndMonth;
    this.monthlyEndMinDate = this.monthlyStartMonth;
  }

  private loadMonthlyChart(): void {
    if (!this.monthlyStartMonth || !this.monthlyEndMonth) return;
    this.monthlyBarLoading = true;

    // O fim é o último dia do mês selecionado para incluir todas as vendas do mês.
    const endDate = new Date(
      this.monthlyEndMonth.getFullYear(),
      this.monthlyEndMonth.getMonth() + 1,
      0,
    );

    this.reportsService
      .getSalesChartMonthly({
        startDate: toApiDate(this.monthlyStartMonth),
        endDate: toApiDate(endDate),
      })
      .subscribe({
        next: (res) => {
          this.monthlyBarData = this.buildSalesBarChartData(res);
          this.monthlyBarLoading = false;
        },
        error: () => {
          this.monthlyBarData = null;
          this.monthlyBarLoading = false;
        },
      });
  }

  // ── Card 3: Monthly chart — handlers ─────────────────────────────────

  /**
   * Atalho de ano: define início = Janeiro e fim = Dezembro do ano selecionado.
   */
  applyYear(ref: Date): void {
    this.monthlyStartMonth = new Date(ref.getFullYear(), 0, 1);
    this.monthlyEndMonth = new Date(ref.getFullYear(), 11, 1);
    this.monthlySelectedYear = new Date(ref.getFullYear(), 0, 1);
    this.updateMonthlyConstraints();
    this.loadMonthlyChart();
  }

  onMonthlyYearSelect(date: Date): void {
    this.applyYear(date);
  }

  onMonthlyStartMonthChange(date: Date | null): void {
    this.monthlyStartMonth = date;
    this.monthlySelectedYear = this.resolveSelectedYear();
    this.updateMonthlyConstraints();
    if (this.monthlyStartMonth && this.monthlyEndMonth) this.loadMonthlyChart();
  }

  onMonthlyEndMonthChange(date: Date | null): void {
    this.monthlyEndMonth = date;
    this.monthlySelectedYear = this.resolveSelectedYear();
    this.updateMonthlyConstraints();
    if (this.monthlyStartMonth && this.monthlyEndMonth) this.loadMonthlyChart();
  }

  /**
   * Retorna o ano destacado no atalho caso início = Jan e fim = Dez do mesmo ano.
   */
  private resolveSelectedYear(): Date | null {
    if (!this.monthlyStartMonth || !this.monthlyEndMonth) return null;
    const s = this.monthlyStartMonth;
    const e = this.monthlyEndMonth;
    const isJan = s.getMonth() === 0;
    const isDec = e.getMonth() === 11;
    const sameYear = s.getFullYear() === e.getFullYear();
    return isJan && isDec && sameYear ? new Date(s.getFullYear(), 0, 1) : null;
  }

  // ── Helpers de tabela ─────────────────────────────────────────────────

  getTypeSeverity(type: SaleType): 'secondary' | 'warn' | undefined {
    switch (type) {
      case 'MAINTENANCE_NORMAL':
        return 'secondary';
      case 'MAINTENANCE_WARRANTY':
        return 'warn';
      default:
        return undefined;
    }
  }

  getTypeLabel(type: SaleType): string {
    switch (type) {
      case 'OS':
        return 'Ordem de Serviço';
      case 'MAINTENANCE_NORMAL':
        return 'Manutenção';
      case 'MAINTENANCE_WARRANTY':
        return 'Garantia';
    }
  }

  navigateToItem(item: SaleListItem): void {
    if (item.type === 'OS') {
      this.router.navigate(['/os', item.code]);
    } else {
      this.router.navigate(['/manutencao', item.code]);
    }
  }
}
