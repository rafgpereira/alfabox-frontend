import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExecutionReportItem {
  id: string;
  executionDate: string;
  osCode: string;
  osId: string;
  totalAmount: number;
  splitAmount: number;
  assemblerCount: number;
  assemblers: string;
}

export interface ExecutionsReportResponse {
  totalPeriodAmount: number;
  totalAssemblerAmount: number;
  executions: ExecutionReportItem[];
}

export interface ExecutionsReportFilter {
  startDate: string;
  endDate: string;
  assemblerId?: string;
}

export interface MaintenanceExecutionReportItem {
  code: string;
  executionDate: string;
  type: 'NORMAL' | 'WARRANTY';
  totalAmount: number;
  laborAmount: number;
  assemblersTotalAmount: number;
  amountPerAssembler: number;
  assemblerCount: number;
  assemblers: string;
}

export interface MaintenanceExecutionsReportResponse {
  totalLaborAmount: number;
  totalAssemblersAmount: number;
  totalAssemblerAmount: number;
  maintenances: MaintenanceExecutionReportItem[];
}

export interface MaintenanceExecutionsReportFilter {
  startDate: string;
  endDate: string;
  assemblerId?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  getMaintenanceExecutionsReport(
    filters: MaintenanceExecutionsReportFilter,
  ): Observable<MaintenanceExecutionsReportResponse> {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.assemblerId) {
      params = params.set('assemblerId', filters.assemblerId);
    }

    return this.http.get<MaintenanceExecutionsReportResponse>(
      `${this.baseUrl}/maintenance-executions`,
      { params },
    );
  }

  getExecutionsReport(filters: ExecutionsReportFilter): Observable<ExecutionsReportResponse> {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.assemblerId) {
      params = params.set('assemblerId', filters.assemblerId);
    }

    return this.http.get<ExecutionsReportResponse>(`${this.baseUrl}/executions`, { params });
  }

  getOrdersReport(filters: OrdersReportFilter): Observable<OrdersReportResponse> {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.sellerId) {
      params = params.set('sellerId', filters.sellerId);
    }

    return this.http.get<OrdersReportResponse>(`${this.baseUrl}/orders`, { params });
  }

  getPaymentsReport(filters: PaymentsReportFilter): Observable<PaymentsReportResponse> {
    let params = new HttpParams();

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.origin) params = params.set('origin', filters.origin);
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);

    return this.http.get<PaymentsReportResponse>(`${this.baseUrl}/payments`, { params });
  }

  getPaymentsChartMonthly(filters: PaymentsChartMonthlyFilter): Observable<PaymentsChartResponse> {
    let params = new HttpParams()
      .set('year', String(filters.year))
      .set('month', String(filters.month));

    if (filters.origin) params = params.set('origin', filters.origin);
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);

    return this.http.get<PaymentsChartResponse>(`${this.baseUrl}/payments/charts/monthly`, {
      params,
    });
  }

  getPaymentsChartYearly(filters: PaymentsChartYearlyFilter): Observable<PaymentsChartResponse> {
    let params = new HttpParams().set('year', String(filters.year));

    if (filters.origin) params = params.set('origin', filters.origin);
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);

    return this.http.get<PaymentsChartResponse>(`${this.baseUrl}/payments/charts/yearly`, {
      params,
    });
  }

  getSalesReport(filters: SalesReportFilter): Observable<SalesReportResponse> {
    const params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);
    return this.http.get<SalesReportResponse>(`${this.baseUrl}/sales`, { params });
  }

  getSalesChartDaily(filters: SalesReportFilter): Observable<SalesChartResponse> {
    const params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);
    return this.http.get<SalesChartResponse>(`${this.baseUrl}/sales/charts/daily`, { params });
  }

  getSalesChartMonthly(filters: SalesReportFilter): Observable<SalesChartResponse> {
    const params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);
    return this.http.get<SalesChartResponse>(`${this.baseUrl}/sales/charts/monthly`, { params });
  }
}

export interface SalesChartResponse {
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}

export interface OrderReportItem {
  id: string;
  code: string;
  orderDate: string;
  clientName: string;
  sellerName: string;
  totalAmount: number;
}

export interface OrdersReportResponse {
  totalAmount: number;
  orders: OrderReportItem[];
}

export interface OrdersReportFilter {
  startDate: string;
  endDate: string;
  sellerId?: string;
}

// ── Pagamentos ────────────────────────────────────────────────────────

export type PaymentOrigin = 'OS' | 'MAINTENANCE';
export type PaymentMethod = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';

export interface PaymentsReportFilter {
  startDate?: string;
  endDate?: string;
  origin?: PaymentOrigin;
  paymentMethod?: PaymentMethod;
}

export interface KpiMetric {
  value: number;
  count: number;
}

export interface PaymentsKpis {
  totalAmount: KpiMetric;
  pixAmount: KpiMetric;
  cashAmount: KpiMetric;
  creditAmount: KpiMetric;
  debitAmount: KpiMetric;
}

export interface PaymentReportItem {
  id: string;
  origin: PaymentOrigin;
  code: string;
  paymentDate: string;
  method: PaymentMethod;
  installments: number | null;
  amount: number;
}

export interface PaymentsReportResponse {
  kpis: PaymentsKpis;
  payments: PaymentReportItem[];
}

// ── Gráficos de Pagamentos ────────────────────────────────────────────

export interface PaymentsChartDataset {
  label: string;
  data: number[];
}

export interface PaymentsChartResponse {
  labels: string[];
  datasets: PaymentsChartDataset[];
}

export interface PaymentsChartMonthlyFilter {
  year: number;
  month: number;
  origin?: PaymentOrigin;
  paymentMethod?: PaymentMethod;
}

export interface PaymentsChartYearlyFilter {
  year: number;
  origin?: PaymentOrigin;
  paymentMethod?: PaymentMethod;
}

// ── Relatório de Vendas ───────────────────────────────────────────────

export type SaleType = 'OS' | 'MAINTENANCE_NORMAL' | 'MAINTENANCE_WARRANTY';

export interface SalesReportFilter {
  startDate: string;
  endDate: string;
}

export interface SaleKpiMetric {
  amount: number;
  count: number;
  avg: number;
}

export interface SalesKpis {
  totalAmount: number;
  os: SaleKpiMetric;
  maintenanceNormal: SaleKpiMetric;
  maintenanceWarranty: { count: number };
}

export interface SalesDoughnutChart {
  labels: string[];
  datasets: Array<{ data: number[] }>;
}

export interface SalesCharts {
  revenueDoughnut: SalesDoughnutChart;
  volumeDoughnut: SalesDoughnutChart;
}

export interface SaleListItem {
  id: string;
  date: string;
  type: SaleType;
  amount: number;
  clientName: string;
  code: string;
}

export interface SalesReportResponse {
  kpis: SalesKpis;
  charts: SalesCharts;
  list: SaleListItem[];
}
