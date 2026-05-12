import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { MaintenanceService, MaintenanceType } from '../../services/maintenance.service';
import { AssemblerService } from '../../services/assembler.service';
import { Assembler } from '../../models/assembler.model';
import { todayLocal, toApiDate } from '../../utils/date.utils';

@Component({
  selector: 'app-maintenance-execution-dialog',
  imports: [...SHARED_CRUD_IMPORTS, MultiSelectModule, TagModule],
  templateUrl: './maintenance-execution-dialog.html',
  styleUrl: './maintenance-execution-dialog.scss',
})
export class MaintenanceExecutionDialogComponent implements OnChanges, OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly assemblerService = inject(AssemblerService);
  private readonly messageService = inject(MessageService);

  // ── Inputs/Outputs ────────────────────────────────────────────────────

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** ID da manutenção a ser executada. */
  @Input() maintenanceId!: string;

  /** Código da manutenção para exibição no card de contexto. */
  @Input() maintenanceCode!: string;

  /** Nome do cliente para exibição no card de contexto. */
  @Input() clientName!: string;

  /**
   * Tipo da manutenção — define a nota informativa sobre divisão de valor.
   * WARRANTY → sem valor; NORMAL → mão de obra dividida entre montadores.
   */
  @Input() type: MaintenanceType = 'NORMAL';

  /**
   * Se verdadeiro, a manutenção já possui execução registrada e o header
   * exibirá "Editar Execução" em vez de "Registrar Execução".
   */
  @Input() hasExecution = false;

  /** Emitido após salvar com sucesso, para a tela pai recarregar os dados. */
  @Output() saved = new EventEmitter<void>();

  // ── Estado interno ────────────────────────────────────────────────────

  saving = false;
  assemblers: Assembler[] = [];

  form = this.fb.nonNullable.group({
    executionDate: [todayLocal() as Date, Validators.required],
    assemblerIds: [[] as string[], Validators.required],
  });

  // ── Computed ──────────────────────────────────────────────────────────

  get header(): string {
    return this.hasExecution ? 'Editar Execução' : 'Registrar Execução';
  }

  get isWarranty(): boolean {
    return this.type === 'WARRANTY';
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
    this.form.reset({
      executionDate: todayLocal(),
      assemblerIds: [],
    });
    this.form.controls.assemblerIds.setValidators([Validators.required]);
    this.form.controls.assemblerIds.updateValueAndValidity();
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

    const payload = {
      executionDate: toApiDate(raw.executionDate),
      assemblerIds: raw.assemblerIds,
    };

    this.maintenanceService.registerExecution(this.maintenanceId, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: this.hasExecution
            ? 'Execução atualizada com sucesso!'
            : 'Execução registrada com sucesso!',
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

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
