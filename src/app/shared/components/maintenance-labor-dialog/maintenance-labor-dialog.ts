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
import { TextareaModule } from 'primeng/textarea';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { MaintenanceService } from '../../services/maintenance.service';
import { MaintenanceType } from '../../models/maintenance.model';

@Component({
  selector: 'app-maintenance-labor-dialog',
  standalone: true,
  imports: [...SHARED_CRUD_IMPORTS, InputNumberModule, TextareaModule],
  templateUrl: './maintenance-labor-dialog.html',
  styleUrl: './maintenance-labor-dialog.scss',
})
export class MaintenanceLaborDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly messageService = inject(MessageService);

  // ── Inputs / Outputs ──────────────────────────────────────────────────

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** UUID da manutenção. */
  @Input() maintenanceId = '';

  /** Tipo da manutenção — WARRANTY oculta o campo de valor de mão de obra. */
  @Input() type: MaintenanceType = 'NORMAL';

  /** Observação atual. */
  @Input() observation: string | null = null;

  /** Valor atual de mão de obra. */
  @Input() laborAmount = 0;

  /** Emitido após salvar com sucesso, para a tela pai recarregar os dados. */
  @Output() saved = new EventEmitter<void>();

  // ── Estado interno ────────────────────────────────────────────────────

  saving = false;

  form = this.fb.nonNullable.group({
    observation: [null as string | null, Validators.maxLength(500)],
    laborAmount: [null as number | null],
  });

  // ── Computed ──────────────────────────────────────────────────────────

  get isWarranty(): boolean {
    return this.type === 'WARRANTY';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.initForm();
    }
  }

  private initForm(): void {
    this.form.reset({
      observation: this.observation ?? null,
      laborAmount: this.laborAmount > 0 ? this.laborAmount : null,
    });

    // Mão de obra obrigatória apenas para NORMAL
    if (this.isWarranty) {
      this.form.controls.laborAmount.clearValidators();
    } else {
      this.form.controls.laborAmount.setValidators([Validators.required, Validators.min(0.01)]);
    }
    this.form.controls.laborAmount.updateValueAndValidity();
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
    const { observation, laborAmount } = this.form.getRawValue();

    this.maintenanceService
      .updateLabor(this.maintenanceId, {
        observation: observation ?? null,
        laborAmount: this.isWarranty ? null : (laborAmount ?? null),
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Dados atualizados com sucesso!',
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
