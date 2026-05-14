import { Component, inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';

import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';
import { MaintenanceService } from '../../../shared/services/maintenance.service';
import { MaintenancePaymentService } from '../../../shared/services/maintenance-payment.service';
import {
  MaintenanceDetail,
  MaintenanceDetailPayment,
  MaintenanceType,
  MaintenancePaymentStatus,
  MaintenanceExecutionStatus,
} from '../../../shared/models/maintenance.model';
import { MaintenancePayment } from '../../../shared/models/maintenance-payment.model';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { CnpjFormatPipe } from '../../../shared/pipes/cnpj-format.pipe';
import { fromApiDate } from '../../../shared/utils/date.utils';
import { whatsappUrl } from '../../../shared/utils/whatsapp.utils';
import { toCents, fromCents } from '../../../shared/utils/money.utils';
import { PaymentDialogComponent } from '../../../shared/components/payment-dialog/payment-dialog';
import { MaintenanceExecutionDialogComponent } from '../../../shared/components/maintenance-execution-dialog/maintenance-execution-dialog';
import { ClientDialogComponent } from '../../../shared/components/client-dialog/client-dialog';
import { Client } from '../../../shared/models/client.model';
import { AddressDialogComponent } from '../../../shared/components/address-dialog/address-dialog';
import { MaintenanceServiceOrderDialogComponent } from '../../../shared/components/maintenance-service-order-dialog/maintenance-service-order-dialog';
import { ServiceOrderLookup } from '../../../shared/models/service-order.model';
import { MaintenanceProductDialogComponent } from '../../../shared/components/maintenance-product-dialog/maintenance-product-dialog';
import { MaintenanceLaborDialogComponent } from '../../../shared/components/maintenance-labor-dialog/maintenance-labor-dialog';

@Component({
  selector: 'app-detail-maintenance',
  imports: [
    ...SHARED_CRUD_IMPORTS,
    CurrencyPipe,
    DatePipe,
    SkeletonModule,
    ProgressBarModule,
    PhoneFormatPipe,
    PaymentDialogComponent,
    MaintenanceExecutionDialogComponent,
    ClientDialogComponent,
    AddressDialogComponent,
    MaintenanceServiceOrderDialogComponent,
    MaintenanceProductDialogComponent,
    MaintenanceLaborDialogComponent,
  ],
  templateUrl: './detail-maintenance.html',
  styleUrl: './detail-maintenance.scss',
})
export class DetailMaintenance implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly maintenancePaymentService = inject(MaintenancePaymentService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  maintenance: MaintenanceDetail | null = null;
  loading = true;

  // ── Dialog Pagamento ──────────────────────────────────────────────────
  paymentDialogVisible = false;
  paymentDialogMode: 'create' | 'edit' = 'create';
  paymentDialogPayment: MaintenancePayment | null = null;

  // ── Dialog Execução ───────────────────────────────────────────────────
  executionDialogVisible = false;

  // ── Dialog Cliente ────────────────────────────────────────────────────
  clientDialogVisible = false;

  // ── Dialog Endereço ───────────────────────────────────────────────────
  addressDialogVisible = false;

  // ── Dialog OS de Origem ───────────────────────────────────────────────
  serviceOrderDialogVisible = false;

  // ── Dialog Produto ────────────────────────────────────────────────────
  productDialogVisible = false;

  // ── Dialog Observação + Mão de Obra ──────────────────────────────────
  laborDialogVisible = false;

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code')!;
    this.loadMaintenance(code);
  }

  private loadMaintenance(code: string): void {
    this.loading = true;
    this.maintenanceService.findByCode(code).subscribe({
      next: (data) => {
        this.maintenance = data;
        this.loading = false;
      },
      error: () => {
        this.router.navigate(['/manutencao']);
      },
    });
  }

  reload(): void {
    const code = this.maintenance?.code ?? this.route.snapshot.paramMap.get('code')!;
    this.loadMaintenance(code);
  }

  // ── Helpers de data ───────────────────────────────────────────────────

  toDate(apiDate: string): Date {
    return fromApiDate(apiDate);
  }

  // ── Helpers de display ────────────────────────────────────────────────

  get documentLabel(): string {
    return this.maintenance?.client.personType === 'J' ? 'CNPJ' : 'CPF';
  }

  formatDocument(): string {
    const client = this.maintenance?.client;
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
    return this.maintenance?.client.personType === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física';
  }

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

  get balance(): number {
    if (!this.maintenance) return 0;
    return fromCents(toCents(this.maintenance.totalAmount) - toCents(this.maintenance.paidAmount));
  }

  get paidPercentage(): number {
    if (!this.maintenance || !this.maintenance.totalAmount) return 0;
    return Math.min(
      100,
      Math.round((this.maintenance.paidAmount / this.maintenance.totalAmount) * 100),
    );
  }

  // ── Navegação ─────────────────────────────────────────────────────────

  return(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/manutencao']);
    }
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Link copiado!',
        detail: window.location.href,
        life: 3000,
      });
    });
  }

  navigateToServiceOrder(code: string): void {
    this.router.navigate(['/os', code]);
  }

  // ── Ações: Endereço ───────────────────────────────────────────────────

  openEditAddressDialog(): void {
    this.addressDialogVisible = true;
  }

  onAddressSaved(updated: {
    street: string | null;
    addressNumber: string | null;
    neighborhood: string | null;
    complement: string | null;
    city: string | null;
  }): void {
    if (this.maintenance) {
      this.maintenance = {
        ...this.maintenance,
        address: {
          street: updated.street,
          addressNumber: updated.addressNumber,
          neighborhood: updated.neighborhood,
          complement: updated.complement,
          city: updated.city,
        },
      };
    }
  }

  // ── Ações: OS de Origem ───────────────────────────────────────────────

  openEditServiceOrderDialog(): void {
    this.serviceOrderDialogVisible = true;
  }

  get currentServiceOrderLookup(): ServiceOrderLookup | null {
    if (!this.maintenance?.serviceOrderCode || !this.maintenance?.serviceOrderId) return null;
    return {
      id: this.maintenance.serviceOrderId,
      code: this.maintenance.serviceOrderCode,
      orderDate: null,
      street: null,
      addressNumber: null,
      neighborhood: null,
      complement: null,
      city: null,
      clientId: this.maintenance.client.id,
      clientName: this.maintenance.client.name,
    };
  }

  onServiceOrderSaved(so: ServiceOrderLookup | null): void {
    if (this.maintenance) {
      this.maintenance = {
        ...this.maintenance,
        serviceOrderCode: so?.code ?? null,
        serviceOrderId: so?.id ?? null,
      };
    }
  }

  // ── Ações: Produto ────────────────────────────────────────────────────

  openEditProductDialog(): void {
    this.productDialogVisible = true;
  }

  confirmRemoveProduct(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseja remover o produto desta manutenção?',
      icon: 'pi pi-trash',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.maintenanceService
          .updateProduct(this.maintenance!.id, {
            productDescription: null,
            productAmount: null,
          })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Produto removido com sucesso!',
              });
              this.reload();
            },
          });
      },
    });
  }

  // ── Ações: Observação + Mão de Obra ──────────────────────────────────

  openEditLaborDialog(): void {
    this.laborDialogVisible = true;
  }

  // ── Ações: Cliente ────────────────────────────────────────────────────

  openEditClientDialog(): void {
    this.clientDialogVisible = true;
  }

  onClientSaved(updated: Client): void {
    if (this.maintenance) {
      this.maintenance = {
        ...this.maintenance,
        client: {
          ...this.maintenance.client,
          name: updated.name,
          personType: updated.personType,
          document: updated.document ?? null,
          isActive: updated.isActive,
          phones: updated.phones.map((p) => ({ id: p.id, number: p.number })),
        },
      };
    }
  }

  // ── Ações: Pagamento ──────────────────────────────────────────────────

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

  openCreatePaymentDialog(): void {
    this.paymentDialogMode = 'create';
    this.paymentDialogPayment = null;
    this.paymentDialogVisible = true;
  }

  openEditPaymentDialog(p: MaintenanceDetailPayment): void {
    this.paymentDialogMode = 'edit';
    this.paymentDialogPayment = {
      id: p.id,
      amount: p.amount,
      paymentDate: p.paymentDate,
      method: p.method as MaintenancePayment['method'],
      installments: p.installments,
      maintenanceId: p.maintenanceId,
    };
    this.paymentDialogVisible = true;
  }

  confirmDeletePayment(event: Event, p: MaintenanceDetailPayment): void {
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
        this.maintenancePaymentService.delete(this.maintenance!.id, p.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Pagamento excluído com sucesso!',
            });
            this.reload();
          },
        });
      },
    });
  }

  // ── Ações: Execução ───────────────────────────────────────────────────

  formatAssemblers(assemblers: { id: string; name: string }[]): string {
    return assemblers.map((a) => a.name).join(', ');
  }

  openExecutionDialog(): void {
    this.executionDialogVisible = true;
  }

  confirmDeleteExecution(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Excluir execução de ${this.toDate(this.maintenance!.executionDate!).toLocaleDateString('pt-BR')}?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.maintenanceService.deleteExecution(this.maintenance!.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Execução excluída com sucesso!',
            });
            this.reload();
          },
        });
      },
    });
  }

  // ── Excluir manutenção ────────────────────────────────────────────────

  confirmDeleteMaintenance(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Tem certeza que deseja excluir a ${this.maintenance!.code}? Esta ação é irreversível e todos os seus dados (pagamentos e execução) serão permanentemente deletados.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir definitivamente',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.maintenanceService.delete(this.maintenance!.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Manutenção excluída com sucesso!',
            });
            this.router.navigate(['/manutencao']);
          },
        });
      },
    });
  }
}
