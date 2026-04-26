import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { ServiceOrderExecutionService } from '../../services/service-order-execution.service';
import { AssemblerService } from '../../services/assembler.service';
import { Assembler } from '../../models/assembler.model';
import {
  ServiceOrderExecution,
  CreateServiceOrderExecution,
  UpdateServiceOrderExecution,
} from '../../models/service-order-execution.model';
import { todayLocal, toApiDate, fromApiDate } from '../../utils/date.utils';
import { toCents, fromCents } from '../../utils/money.utils';

export type ExecutionDialogMode = 'create' | 'edit';

@Component({
  selector: 'app-execution-dialog',
  imports: [...SHARED_CRUD_IMPORTS, InputNumberModule, MultiSelectModule, TagModule],
  templateUrl: './execution-dialog.html',
  styleUrl: './execution-dialog.scss',
})
export class ExecutionDialogComponent implements OnChanges, OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly executionService = inject(ServiceOrderExecutionService);
  private readonly assemblerService = inject(AssemblerService);
  private readonly messageService = inject(MessageService);

  // ── Inputs/Outputs ────────────────────────────────────────────────────

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() orderId!: string;
  @Input() orderCode!: string;

  /** Nome do cliente da OS para exibição no card de contexto. */
  @Input() clientName!: string;

  /** Valor total da OS (em reais). Usado para calcular o disponível. */
  @Input() orderTotal = 0;

  /** Valor já executado da OS (em reais). Usado para calcular o disponível. */
  @Input() executedAmount = 0;

  @Input() mode: ExecutionDialogMode = 'create';

  /** Execução a editar (obrigatório quando mode === 'edit'). */
  @Input() execution: ServiceOrderExecution | null = null;

  @Output() saved = new EventEmitter<void>();

  // ── Estado interno ────────────────────────────────────────────────────

  saving = false;
  assemblers: Assembler[] = [];

  form = this.fb.nonNullable.group({
    executionDate: [todayLocal() as Date, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    assemblerIds: [[] as string[], Validators.required],
  });

  // ── Computed ──────────────────────────────────────────────────────────

  get header(): string {
    return this.mode === 'create' ? 'Registrar Execução' : 'Editar Execução';
  }

  /** Valor disponível para execução (nunca negativo). */
  get availableAmount(): number {
    const executedCents = toCents(this.executedAmount);
    const currentCents =
      this.mode === 'edit' && this.execution ? toCents(this.execution.amount) : 0;
    const available = toCents(this.orderTotal) - executedCents + currentCents;
    return fromCents(Math.max(0, available));
  }

  formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  /** Montadores vinculados à execução em edição, para exibição como p-tags. */
  get executionAssemblers(): Assembler[] {
    if (!this.execution?.assemblerIds?.length) return [];
    return this.assemblers.filter((a) => this.execution!.assemblerIds.includes(a.id));
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAssemblers();
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.initForm();
    }
  }

  private loadAssemblers(): void {
    this.assemblerService.findAll(true).subscribe({
      next: (list) => {
        this.assemblers = list;
      },
    });
  }

  private initForm(): void {
    const maxAmount = this.availableAmount;
    if (this.mode === 'edit' && this.execution) {
      this.form.reset({
        executionDate: fromApiDate(this.execution.executionDate),
        amount: this.execution.amount,
        assemblerIds: [], // não editável — ignorado no submit
      });
      this.form.controls.assemblerIds.disable();
    } else {
      this.form.reset({
        executionDate: todayLocal(),
        amount: null,
        assemblerIds: [],
      });
      this.form.controls.assemblerIds.enable();
    }
    this.form.controls.amount.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(maxAmount),
    ]);
    this.form.controls.amount.updateValueAndValidity();
    this.form.markAsPristine();
    this.form.markAsUntouched();
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
      const payload: CreateServiceOrderExecution = {
        executionDate: toApiDate(raw.executionDate),
        amount: raw.amount!,
        assemblerIds: raw.assemblerIds,
      };
      this.executionService.create(this.orderId, payload).subscribe({
        next: () => this.onSuccess('Execução registrada com sucesso!'),
        error: () => {
          this.saving = false;
        },
      });
    } else {
      const payload: UpdateServiceOrderExecution = {
        executionDate: toApiDate(raw.executionDate),
        amount: raw.amount!,
      };
      this.executionService.update(this.orderId, this.execution!.id, payload).subscribe({
        next: () => this.onSuccess('Execução atualizada com sucesso!'),
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
