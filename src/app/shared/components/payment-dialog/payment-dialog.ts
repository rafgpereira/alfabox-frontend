import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { ServiceOrderPaymentService } from '../../services/service-order-payment.service';
import {
  ServiceOrderPayment,
  PaymentMethod,
  CreateServiceOrderPayment,
  UpdateServiceOrderPayment,
} from '../../models/service-order-payment.model';
import { todayLocal, toApiDate, fromApiDate } from '../../utils/date.utils';
import { toCents, fromCents } from '../../utils/money.utils';

export type PaymentDialogMode = 'create' | 'edit';

@Component({
  selector: 'app-payment-dialog',
  imports: [...SHARED_CRUD_IMPORTS, InputNumberModule],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.scss',
})
export class PaymentDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(ServiceOrderPaymentService);
  private readonly messageService = inject(MessageService);

  // ── Inputs/Outputs ────────────────────────────────────────────────────

  /** Controla visibilidade do dialog (two-way via visible/visibleChange). */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** ID da Ordem de Serviço à qual o pagamento pertence. */
  @Input() orderId!: string;

  /** Código da OS para exibição no card de contexto. */
  @Input() orderCode!: string;

  /** Nome do cliente da OS para exibição no card de contexto. */
  @Input() clientName!: string;

  /** Valor total da OS (em reais). Usado para calcular o disponível. */
  @Input() orderTotal = 0;

  /** Valor já pago da OS (em reais). Usado para calcular o disponível. */
  @Input() paidAmount = 0;

  /** 'create' para novo pagamento, 'edit' para editar o existente. */
  @Input() mode: PaymentDialogMode = 'create';

  /** Pagamento a editar (obrigatório quando mode === 'edit'). */
  @Input() payment: ServiceOrderPayment | null = null;

  /** Emitido após salvar com sucesso, para a tela pai recarregar os dados. */
  @Output() saved = new EventEmitter<void>();

  // ── Estado interno ────────────────────────────────────────────────────

  saving = false;

  readonly paymentMethodOptions: { label: string; value: PaymentMethod }[] = [
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
    { label: 'Cartão de Débito', value: 'CARTAO_DEBITO' },
    { label: 'Pix', value: 'PIX' },
  ];

  selectedMethod: { label: string; value: PaymentMethod } | null = null;
  methodSuggestions: { label: string; value: PaymentMethod }[] = [];

  form = this.fb.nonNullable.group({
    paymentDate: [todayLocal() as Date, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    method: [null as PaymentMethod | null, Validators.required],
    installments: [null as number | null],
  });

  // ── Computed ──────────────────────────────────────────────────────────

  get header(): string {
    return this.mode === 'create' ? 'Lançar Pagamento' : 'Editar Pagamento';
  }

  get isCredit(): boolean {
    return this.form.controls.method.value === 'CARTAO_CREDITO';
  }

  /** Valor disponível para pagamento (centavos → reais, nunca negativo). */
  get availableAmount(): number {
    const paidCents = toCents(this.paidAmount);
    const currentCents = this.mode === 'edit' && this.payment ? toCents(this.payment.amount) : 0;
    const available = toCents(this.orderTotal) - paidCents + currentCents;
    return fromCents(Math.max(0, available));
  }

  formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnChanges(): void {
    if (this.visible) {
      this.initForm();
    }
  }

  private initForm(): void {
    const maxAmount = this.availableAmount;
    if (this.mode === 'edit' && this.payment) {
      const p = this.payment;
      const method = this.paymentMethodOptions.find((o) => o.value === p.method) ?? null;
      this.selectedMethod = method;
      this.form.reset({
        paymentDate: fromApiDate(p.paymentDate),
        amount: p.amount,
        method: p.method,
        installments: p.installments,
      });
    } else {
      this.selectedMethod = null;
      this.form.reset({
        paymentDate: todayLocal(),
        amount: null,
        method: null,
        installments: null,
      });
    }
    this.form.controls.amount.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(maxAmount),
    ]);
    this.form.controls.amount.updateValueAndValidity();
    this.updateInstallmentsValidator();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // ── Autocomplete de método ────────────────────────────────────────────

  searchMethods(event: AutoCompleteCompleteEvent): void {
    const q = event.query.toLowerCase();
    this.methodSuggestions = this.paymentMethodOptions.filter((o) =>
      o.label.toLowerCase().includes(q),
    );
  }

  onMethodSelect(event: AutoCompleteSelectEvent): void {
    const selected = event.value as { label: string; value: PaymentMethod };
    this.form.controls.method.setValue(selected.value);
    this.updateInstallmentsValidator();
  }

  onMethodClear(): void {
    this.form.controls.method.setValue(null);
    this.form.controls.installments.setValue(null);
    this.updateInstallmentsValidator();
  }

  private updateInstallmentsValidator(): void {
    const ctrl = this.form.controls.installments;
    if (this.isCredit) {
      ctrl.setValidators([Validators.required, Validators.min(1), Validators.max(12)]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue(null);
    }
    ctrl.updateValueAndValidity();
  }

  // ── Submit ────────────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return ctrl ? ctrl.invalid && (ctrl.touched || ctrl.dirty) : false;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving = true;
    const raw = this.form.getRawValue();

    if (this.mode === 'create') {
      const payload: CreateServiceOrderPayment = {
        paymentDate: toApiDate(raw.paymentDate),
        amount: raw.amount!,
        method: raw.method!,
        installments: this.isCredit ? raw.installments : null,
      };
      this.paymentService.create(this.orderId, payload).subscribe({
        next: () => this.onSuccess('Pagamento lançado com sucesso!'),
        error: () => {
          this.saving = false;
        },
      });
    } else {
      const payload: UpdateServiceOrderPayment = {
        paymentDate: toApiDate(raw.paymentDate),
        amount: raw.amount!,
        method: raw.method!,
        installments: this.isCredit ? raw.installments : null,
      };
      this.paymentService.update(this.orderId, this.payment!.id, payload).subscribe({
        next: () => this.onSuccess('Pagamento atualizado com sucesso!'),
        error: () => {
          this.saving = false;
        },
      });
    }
  }

  private onSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail });
    this.saving = false;
    this.close();
    this.saved.emit();
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
