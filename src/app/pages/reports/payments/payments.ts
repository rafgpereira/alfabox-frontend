import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';
import {
  ReportsService,
  PaymentReportItem,
  PaymentsReportResponse,
  PaymentOrigin,
  PaymentMethod,
  PaymentsChartResponse,
} from '../../../shared/services/reports.service';
import { toApiDate } from '../../../shared/utils/date.utils';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-payments',
  imports: [...SHARED_CRUD_IMPORTS, CurrencyPipe, DatePipe, ChartModule],
  templateUrl: './payments.html',
  styleUrl: './payments.scss',
})
export class Payments implements OnInit {
  private readonly router = inject(Router);
  private readonly reportsService = inject(ReportsService);

  // ── Estado ────────────────────────────────────────────────────────────

  report: PaymentsReportResponse | null = null;
  payments: PaymentReportItem[] = [];
  loading = false;

  // ── Filtros globais ───────────────────────────────────────────────────

  selectedOrigin: PaymentOrigin | null = null;
  selectedMethod: PaymentMethod | null = null;

  originOptions: SelectOption<PaymentOrigin>[] = [
    { label: 'Ordem de Serviço', value: 'OS' },
    { label: 'Manutenção', value: 'MAINTENANCE' },
  ];

  methodOptions: SelectOption<PaymentMethod>[] = [
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'PIX', value: 'PIX' },
    { label: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
    { label: 'Cartão de Débito', value: 'CARTAO_DEBITO' },
  ];

  // ── Filtros de data ───────────────────────────────────────────────────

  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedMonth: Date | null = null;

  // ── Gráfico de rosca (card 1) ───────────────────────────────────────

  chartData: object | null = null;
  chartOptions: object | null = null;

  // ── Gráficos de barras (cards 2 e 3) ──────────────────────────────

  // Card 2: Distribuição por Dia
  dailyChartStartDate: Date | null = null;
  dailyChartEndDate: Date | null = null;
  dailyChartSelectedMonth: Date | null = null;

  monthlyBarData: object | null = null;
  monthlyBarOptions: object | null = null;
  monthlyBarLoading = false;

  // Card 3: Distribuição por Mês
  yearlyChartStartMonth: Date | null = null;
  yearlyChartEndMonth: Date | null = null;
  yearlyChartSelectedYear: Date | null = null;
  yearlyChartStartMaxDate: Date | null = null;
  yearlyChartEndMinDate: Date | null = null;

  yearlyBarData: object | null = null;
  yearlyBarOptions: object | null = null;
  yearlyBarLoading = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initChartOptions();
    this.initBarChartOptions();
    this.loadCurrentMonth();
    this.initDailyChart();
    this.initYearlyChart();
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
    this.load();
  }

  private load(): void {
    if (!this.startDate || !this.endDate) return;
    this.loading = true;
    this.reportsService
      .getPaymentsReport({
        startDate: toApiDate(this.startDate),
        endDate: toApiDate(this.endDate),
        origin: this.selectedOrigin ?? undefined,
        paymentMethod: this.selectedMethod ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.report = res;
          this.payments = res.payments;
          this.updateChartData(res);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  // ── Chart ─────────────────────────────────────────────────────────────

  private initChartOptions(): void {
    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--p-text-color').trim();

    this.chartOptions = {
      cutout: '65%',
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textColor,
            padding: 16,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { label: string; formattedValue: string }) =>
              ` ${ctx.label}: R$ ${ctx.formattedValue}`,
          },
        },
      },
    };
  }

  private updateChartData(res: PaymentsReportResponse): void {
    const style = getComputedStyle(document.documentElement);
    const green = style.getPropertyValue('--p-green-500').trim();
    const cyan = style.getPropertyValue('--p-cyan-500').trim();
    const red = style.getPropertyValue('--p-red-500').trim();
    const orange = style.getPropertyValue('--p-orange-500').trim();

    const { pixAmount, cashAmount, creditAmount, debitAmount } = res.kpis;

    this.chartData = {
      labels: ['PIX', 'Dinheiro', 'Crédito', 'Débito'],
      datasets: [
        {
          data: [pixAmount.value, cashAmount.value, creditAmount.value, debitAmount.value],
          backgroundColor: [cyan, green, red, orange],
          hoverBackgroundColor: [cyan, green, red, orange],
          borderWidth: 2,
        },
      ],
    };
  }

  // ── Handlers de filtro ────────────────────────────────────────────────

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

  onGlobalFilterChange(): void {
    this.load();
    this.loadDailyChart();
    this.loadYearlyChart();
  }

  private resolveSelectedMonth(): Date | null {
    if (!this.startDate || !this.endDate) return null;
    const s = this.startDate;
    const e = this.endDate;
    const firstDay = new Date(s.getFullYear(), s.getMonth(), 1);
    const lastDay = new Date(s.getFullYear(), s.getMonth() + 1, 0);
    const isFullMonth = s.getTime() === firstDay.getTime() && e.getTime() === lastDay.getTime();
    return isFullMonth ? firstDay : null;
  }

  // ── Helpers de exibição ────────────────────────────────────────────────
  getMethodSeverity(
    method: PaymentMethod,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    switch (method) {
      case 'DINHEIRO':
        return 'success';
      case 'PIX':
        return 'info';
      case 'CARTAO_CREDITO':
        return 'danger';
      case 'CARTAO_DEBITO':
        return 'warn';
    }
  }

  getMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case 'DINHEIRO':
        return 'DINHEIRO';
      case 'PIX':
        return 'PIX';
      case 'CARTAO_CREDITO':
        return 'CRÉDITO';
      case 'CARTAO_DEBITO':
        return 'DÉBITO';
    }
  }

  getOriginSeverity(origin: PaymentOrigin): 'secondary' | undefined {
    return origin === 'MAINTENANCE' ? 'secondary' : undefined;
  }

  getOriginLabel(origin: PaymentOrigin): string {
    return origin === 'OS' ? 'Ordem de Serviço' : 'Manutenção';
  }

  // ── Bar Charts: opções e dados ────────────────────────────────────────

  private initBarChartOptions(): void {
    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--p-text-color').trim();
    const textMuted = style.getPropertyValue('--p-text-muted-color').trim();
    const borderColor = style.getPropertyValue('--p-content-border-color').trim();

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

    this.monthlyBarOptions = options;
    this.yearlyBarOptions = { ...options };
  }

  private buildBarChartData(res: PaymentsChartResponse): object {
    const style = getComputedStyle(document.documentElement);
    const colorMap: Record<string, string> = {
      Pix: style.getPropertyValue('--p-cyan-500').trim(),
      Dinheiro: style.getPropertyValue('--p-green-500').trim(),
      Crédito: style.getPropertyValue('--p-red-500').trim(),
      Débito: style.getPropertyValue('--p-orange-500').trim(),
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

  private loadMonthlyChart(): void {
    if (!this.dailyChartStartDate || !this.dailyChartEndDate) return;
    this.monthlyBarLoading = true;

    this.reportsService
      .getPaymentsChartMonthly({
        startDate: toApiDate(this.dailyChartStartDate),
        endDate: toApiDate(this.dailyChartEndDate),
        origin: this.selectedOrigin ?? undefined,
        paymentMethod: this.selectedMethod ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.monthlyBarData = this.buildBarChartData(res);
          this.monthlyBarLoading = false;
        },
        error: () => {
          this.monthlyBarData = null;
          this.monthlyBarLoading = false;
        },
      });
  }

  // Alias para método chamado por onGlobalFilterChange
  private loadDailyChart(): void {
    this.loadMonthlyChart();
  }

  private loadYearlyChart(): void {
    if (!this.yearlyChartStartMonth || !this.yearlyChartEndMonth) return;
    this.yearlyBarLoading = true;

    const endDate = new Date(
      this.yearlyChartEndMonth.getFullYear(),
      this.yearlyChartEndMonth.getMonth() + 1,
      0,
    );

    this.reportsService
      .getPaymentsChartYearly({
        startDate: toApiDate(this.yearlyChartStartMonth),
        endDate: toApiDate(endDate),
        origin: this.selectedOrigin ?? undefined,
        paymentMethod: this.selectedMethod ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.yearlyBarData = this.buildBarChartData(res);
          this.yearlyBarLoading = false;
        },
        error: () => {
          this.yearlyBarData = null;
          this.yearlyBarLoading = false;
        },
      });
  }

  // ── Card 2: handlers do gráfico diário ─────────────────────────────────

  private initDailyChart(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.dailyChartEndDate = today;
    this.dailyChartStartDate = thirtyDaysAgo;
    this.dailyChartSelectedMonth = null;
    this.loadMonthlyChart();
  }

  applyDailyChartMonth(ref: Date): void {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    this.dailyChartStartDate = start;
    this.dailyChartEndDate = end;
    this.dailyChartSelectedMonth = start;
    this.loadMonthlyChart();
  }

  onDailyChartMonthSelect(date: Date): void {
    if (!date) return;
    this.applyDailyChartMonth(date);
  }

  onDailyChartStartDateChange(date: Date | null): void {
    this.dailyChartStartDate = date;
    this.dailyChartSelectedMonth = this.resolveSelectedDailyChartMonth();
    if (this.dailyChartStartDate && this.dailyChartEndDate) this.loadMonthlyChart();
  }

  onDailyChartEndDateChange(date: Date | null): void {
    this.dailyChartEndDate = date;
    this.dailyChartSelectedMonth = this.resolveSelectedDailyChartMonth();
    if (this.dailyChartStartDate && this.dailyChartEndDate) this.loadMonthlyChart();
  }

  private resolveSelectedDailyChartMonth(): Date | null {
    const s = this.dailyChartStartDate;
    const e = this.dailyChartEndDate;
    if (!s || !e) return null;
    const firstDay = new Date(s.getFullYear(), s.getMonth(), 1);
    const lastDay = new Date(s.getFullYear(), s.getMonth() + 1, 0);
    const isFullMonth = s.getTime() === firstDay.getTime() && e.getTime() === lastDay.getTime();
    return isFullMonth ? firstDay : null;
  }

  // ── Card 3: handlers do gráfico mensal ────────────────────────────────

  private initYearlyChart(): void {
    const now = new Date();
    this.yearlyChartEndMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.yearlyChartStartMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    this.yearlyChartSelectedYear = null;
    this.updateYearlyChartConstraints();
    this.loadYearlyChart();
  }

  private updateYearlyChartConstraints(): void {
    this.yearlyChartStartMaxDate = this.yearlyChartEndMonth;
    this.yearlyChartEndMinDate = this.yearlyChartStartMonth;
  }

  applyYearlyChartYear(ref: Date): void {
    this.yearlyChartStartMonth = new Date(ref.getFullYear(), 0, 1);
    this.yearlyChartEndMonth = new Date(ref.getFullYear(), 11, 1);
    this.yearlyChartSelectedYear = new Date(ref.getFullYear(), 0, 1);
    this.updateYearlyChartConstraints();
    this.loadYearlyChart();
  }

  onYearlyChartYearSelect(date: Date): void {
    if (!date) return;
    this.applyYearlyChartYear(date);
  }

  onYearlyChartStartMonthChange(date: Date | null): void {
    this.yearlyChartStartMonth = date;
    this.yearlyChartSelectedYear = this.resolveSelectedYearlyChartYear();
    this.updateYearlyChartConstraints();
    if (this.yearlyChartStartMonth && this.yearlyChartEndMonth) this.loadYearlyChart();
  }

  onYearlyChartEndMonthChange(date: Date | null): void {
    this.yearlyChartEndMonth = date;
    this.yearlyChartSelectedYear = this.resolveSelectedYearlyChartYear();
    this.updateYearlyChartConstraints();
    if (this.yearlyChartStartMonth && this.yearlyChartEndMonth) this.loadYearlyChart();
  }

  private resolveSelectedYearlyChartYear(): Date | null {
    const s = this.yearlyChartStartMonth;
    const e = this.yearlyChartEndMonth;
    if (!s || !e) return null;
    const isJan = s.getMonth() === 0;
    const isDec = e.getMonth() === 11;
    const sameYear = s.getFullYear() === e.getFullYear();
    return isJan && isDec && sameYear ? new Date(s.getFullYear(), 0, 1) : null;
  }

  // ── Navegação ─────────────────────────────────────────────────────────

  navigateToItem(item: PaymentReportItem): void {
    if (item.origin === 'OS') {
      this.router.navigate(['/os', item.code]);
    } else {
      this.router.navigate(['/manutencao', item.code]);
    }
  }
}
