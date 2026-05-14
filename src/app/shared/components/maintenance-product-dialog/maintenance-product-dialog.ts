import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { MaintenanceService } from '../../services/maintenance.service';
import { MaintenanceType } from '../../models/maintenance.model';

export interface ProductSavedEvent {
  productDescription: string;
  productAmount: number | null;
  totalAmount: number;
}

@Component({
  selector: 'app-maintenance-product-dialog',
  standalone: true,
  imports: [...SHARED_CRUD_IMPORTS, InputNumberModule],
  templateUrl: './maintenance-product-dialog.html',
  styleUrl: './maintenance-product-dialog.scss',
})
export class MaintenanceProductDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly messageService = inject(MessageService);

  // ── Inputs / Outputs ──────────────────────────────────────────────────

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** UUID da manutenção. */
  @Input() maintenanceId = '';

  /** Tipo da manutenção — WARRANTY oculta o campo de valor. */
  @Input() type: MaintenanceType = 'NORMAL';

  /** Descrição atual do produto (null = sem produto). */
  @Input() productDescription: string | null = null;

  /** Valor atual do produto (null = sem produto). */
  @Input() productAmount: number | null = null;

  /**
   * Emitido após salvar com sucesso.
   * O pai deve atualizar `maintenance.productDescription`,
   * `maintenance.productAmount` e `maintenance.totalAmount` com esses valores.
   * O totalAmount é recalculado pelo backend — fazemos reload via saved (sem dados),
   * mas emitimos o evento para que o pai possa atualizar localmente se desejar.
   */
  @Output() saved = new EventEmitter<void>();

  // ── Estado interno ────────────────────────────────────────────────────

  saving = false;

  form = this.fb.nonNullable.group({
    productDescription: [null as string | null, [Validators.required, Validators.maxLength(500)]],
    productAmount: [null as number | null],
  });

  // ── Computed ──────────────────────────────────────────────────────────

  get isWarranty(): boolean {
    return this.type === 'WARRANTY';
  }

  get header(): string {
    return this.productDescription ? 'Editar Produto' : 'Adicionar Produto';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.initForm();
    }
  }

  private initForm(): void {
    // Se não há produto ainda (descrição nula), o valor começa limpo (null),
    // independente de productAmount ser 0 no modelo.
    const hasProduct = this.productDescription !== null;

    this.form.reset({
      productDescription: hasProduct ? this.productDescription : null,
      productAmount: hasProduct && !this.isWarranty ? this.productAmount || null : null,
    });

    // Valor obrigatório apenas para NORMAL
    if (this.isWarranty) {
      this.form.controls.productAmount.clearValidators();
    } else {
      this.form.controls.productAmount.setValidators([Validators.required, Validators.min(0.01)]);
    }
    this.form.controls.productAmount.updateValueAndValidity();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  // ── Salvar ────────────────────────────────────────────────────────────

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving = true;
    const { productDescription, productAmount } = this.form.getRawValue();

    this.maintenanceService
      .updateProduct(this.maintenanceId, {
        productDescription: productDescription ?? null,
        productAmount: this.isWarranty ? null : (productAmount ?? null),
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Produto atualizado com sucesso!',
          });
          this.saving = false;
          this.close();
          this.saved.emit();
        },
        error: () => {
          this.saving = false;
        },
      });
  }
}
