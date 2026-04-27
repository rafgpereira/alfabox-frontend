import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ServiceOrderService } from '../../../shared/services/service-order.service';
import { ServiceOrderPaymentService } from '../../../shared/services/service-order-payment.service';
import { ServiceOrderExecutionService } from '../../../shared/services/service-order-execution.service';
import { PaymentDialogComponent } from '../../../shared/components/payment-dialog/payment-dialog';
import { ExecutionDialogComponent } from '../../../shared/components/execution-dialog/execution-dialog';
import { ClientDialogComponent } from '../../../shared/components/client-dialog/client-dialog';
import { Client } from '../../../shared/models/client.model';
import {
  ServiceOrderDetail,
  ServiceOrderDetailItem,
  ServiceOrderDetailPayment,
  ServiceOrderDetailExecution,
  PaymentStatus,
  ExecutionStatus,
} from '../../../shared/models/service-order.model';
import { ServiceOrderPayment } from '../../../shared/models/service-order-payment.model';
import { ServiceOrderExecution } from '../../../shared/models/service-order-execution.model';
import { fromApiDate } from '../../../shared/utils/date.utils';
import { toCents, fromCents } from '../../../shared/utils/money.utils';
import { whatsappUrl } from '../../../shared/utils/whatsapp.utils';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { CnpjFormatPipe } from '../../../shared/pipes/cnpj-format.pipe';

@Component({
  selector: 'app-detail-service-order',
  imports: [
    ...SHARED_CRUD_IMPORTS,
    CurrencyPipe,
    DatePipe,
    ProgressBarModule,
    PhoneFormatPipe,
    PaymentDialogComponent,
    ExecutionDialogComponent,
    ClientDialogComponent,
  ],
  providers: [],
  templateUrl: './detail-service-order.html',
  styleUrl: './detail-service-order.scss',
})
export class DetailServiceOrder implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly serviceOrderService = inject(ServiceOrderService);
  private readonly messageService = inject(MessageService);
  private readonly paymentService = inject(ServiceOrderPaymentService);
  private readonly executionService = inject(ServiceOrderExecutionService);
  private readonly confirmationService = inject(ConfirmationService);

  order: ServiceOrderDetail | null = null;
  loading = true;

  // ── Dialog Pagamento ──────────────────────────────────────────────────
  paymentDialogVisible = false;
  paymentDialogMode: 'create' | 'edit' = 'create';
  paymentDialogPayment: ServiceOrderPayment | null = null;

  // ── Dialog Execução ───────────────────────────────────────────────────
  executionDialogVisible = false;
  executionDialogMode: 'create' | 'edit' = 'create';
  executionDialogExecution: ServiceOrderExecution | null = null;

  // ── Dialog Cliente ────────────────────────────────────────────────────
  clientDialogVisible = false;

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code')!;
    this.loadOrder(code);
  }

  private loadOrder(code: string): void {
    this.loading = true;
    this.serviceOrderService.findByCode(code).subscribe({
      next: (data) => {
        this.order = data;
        this.loading = false;
      },
      error: () => {
        this.router.navigate(['/os']);
      },
    });
  }

  reload(): void {
    const code = this.order?.code ?? this.route.snapshot.paramMap.get('code')!;
    this.loadOrder(code);
  }

  // ── Getters calculados ────────────────────────────────────────────────

  get balance(): number {
    if (!this.order) return 0;
    return fromCents(toCents(this.order.totalAmount) - toCents(this.order.paidAmount));
  }

  get toExecute(): number {
    if (!this.order) return 0;
    return fromCents(toCents(this.order.totalAmount) - toCents(this.order.executedAmount));
  }

  get paidPercentage(): number {
    if (!this.order || !this.order.totalAmount) return 0;
    return Math.min(100, Math.round((this.order.paidAmount / this.order.totalAmount) * 100));
  }

  get executedPercentage(): number {
    if (!this.order || !this.order.totalAmount) return 0;
    return Math.min(100, Math.round((this.order.executedAmount / this.order.totalAmount) * 100));
  }

  // ── Helpers de data ───────────────────────────────────────────────────

  toDate(apiDate: string): Date {
    return fromApiDate(apiDate);
  }

  // ── Helpers de display ────────────────────────────────────────────────

  get documentLabel(): string {
    return this.order?.client.personType === 'J' ? 'CNPJ' : 'CPF';
  }

  formatDocument(): string {
    const client = this.order?.client;
    if (!client?.document) return 'Não cadastrado';
    if (client.personType === 'J') return new CnpjFormatPipe().transform(client.document);
    return new CpfFormatPipe().transform(client.document);
  }

  formatPhone(number: string): string {
    return new PhoneFormatPipe().transform(number);
  }

  whatsappUrl(number: string): string {
    return whatsappUrl(number);
  }

  formatPersonType(): string {
    return this.order?.client.personType === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física';
  }

  itemDescription(item: ServiceOrderDetailItem): string {
    const parts = [item.product?.name, item.details].filter(Boolean);
    return parts.join(' - ');
  }

  formatPaymentMethod(method: string, installments: number | null): string {
    const labels: Record<string, string> = {
      DINHEIRO: 'Dinheiro',
      PIX: 'PIX',
      CARTAO_DEBITO: 'Cartão de Débito',
      CARTAO_CREDITO: 'Cartão de Crédito',
    };
    const label = labels[method] ?? method;
    if (method === 'CARTAO_CREDITO' && installments && installments > 1) {
      return `${label} ${installments}x`;
    }
    return label;
  }

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

  formatAssemblers(assemblers: { id: string; name: string }[]): string {
    return assemblers.map((a) => a.name).join(', ');
  }

  // ── Ações: Pagamento ──────────────────────────────────────────────────

  openCreatePaymentDialog(): void {
    this.paymentDialogMode = 'create';
    this.paymentDialogPayment = null;
    this.paymentDialogVisible = true;
  }

  openEditPaymentDialog(p: ServiceOrderDetailPayment): void {
    this.paymentDialogMode = 'edit';
    this.paymentDialogPayment = {
      id: p.id,
      amount: p.amount,
      paymentDate: p.paymentDate,
      method: p.method as ServiceOrderPayment['method'],
      installments: p.installments,
    };
    this.paymentDialogVisible = true;
  }

  confirmDeletePayment(event: Event, p: ServiceOrderDetailPayment): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Excluir pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)} (${this.toDate(p.paymentDate).toLocaleDateString('pt-BR')})?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.paymentService.delete(this.order!.id, p.id).subscribe({
          next: () => this.reload(),
        });
      },
    });
  }

  // ── Ações: Execução ───────────────────────────────────────────────────

  openCreateExecutionDialog(): void {
    this.executionDialogMode = 'create';
    this.executionDialogExecution = null;
    this.executionDialogVisible = true;
  }

  openEditExecutionDialog(e: ServiceOrderDetailExecution): void {
    this.executionDialogMode = 'edit';
    this.executionDialogExecution = {
      id: e.id,
      amount: e.amount,
      executionDate: e.executionDate,
      splitAmount: e.splitAmount,
      assemblerIds: e.assemblers.map((a) => a.id),
    };
    this.executionDialogVisible = true;
  }

  confirmDeleteExecution(event: Event, e: ServiceOrderDetailExecution): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Excluir execução de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.amount)} (${this.toDate(e.executionDate).toLocaleDateString('pt-BR')})?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.executionService.delete(this.order!.id, e.id).subscribe({
          next: () => this.reload(),
        });
      },
    });
  }

  return(): void {
    this.router.navigate(['/os']);
  }

  // ── Ações: Cliente ────────────────────────────────────────────────────

  openEditClientDialog(): void {
    this.clientDialogVisible = true;
  }

  onClientSaved(updated: Client): void {
    // Atualiza os dados do cliente na OS sem recarregar tudo da API
    if (this.order) {
      this.order = {
        ...this.order,
        client: {
          ...this.order.client,
          name: updated.name,
          personType: updated.personType,
          document: updated.document,
          isActive: updated.isActive,
          phones: updated.phones,
        },
      };
    }
  }

  confirmDeleteOrder(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Tem certeza que deseja excluir a OS ${this.order!.code}? Esta ação é irreversível e todos os dados da ordem (pagamentos e execuções) serão permanentemente deletados.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir definitivamente',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.serviceOrderService.delete(this.order!.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Ordem de Serviço excluída com sucesso!',
            });
            this.router.navigate(['/os']);
          },
        });
      },
    });
  }
}
