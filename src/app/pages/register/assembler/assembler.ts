import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { AssemblerService } from '../../../shared/services/assembler.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Assembler as AssemblerModel } from '../../../shared/models/assembler.model';
import { cpfValidator } from '../../../shared/validators/cpf.validator';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';

@Component({
  selector: 'app-assembler',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputMaskModule,
    FloatLabelModule,
    ButtonModule,
    ErrorMessageComponent,
    TableModule,
    TagModule,
    Dialog,
    ToggleSwitch,
    SelectModule,
    CpfFormatPipe,
  ],
  templateUrl: './assembler.html',
  styleUrl: './assembler.scss',
})
export class Assembler implements OnInit {
  private fb = inject(FormBuilder);
  private assemblerService = inject(AssemblerService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── Estado ────────────────────────────────────────────────────────────

  assemblers: AssemblerModel[] = [];
  loading = false;
  saving = false;

  // Dialog de edição
  editDialogVisible = false;
  editLoading = false;
  editAssembler: AssemblerModel | null = null;

  editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    isActive: [true],
  });

  // Formulário de cadastro
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    document: ['', [Validators.required, cpfValidator]],
  });

  // Opções do filtro de status
  statusOptions = [
    { label: 'Ativo', value: true },
    { label: 'Inativo', value: false },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAssemblers();
  }

  // ── Helpers de formulário ─────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  isEditInvalid(field: string): boolean {
    const control = this.editForm.get(field);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Ativo' : 'Inativo';
  }

  // ── CRUD ──────────────────────────────────────────────────────────────

  loadAssemblers(): void {
    this.loading = true;
    this.assemblerService.findAll().subscribe({
      next: (assemblers) => {
        this.assemblers = assemblers;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const raw = this.form.getRawValue();

    this.assemblerService.create(raw).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Montador cadastrado com sucesso!',
        });
        this.form.reset();
        this.saving = false;
        this.loadAssemblers();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // ── Edição ────────────────────────────────────────────────────────────

  openEditDialog(assembler: AssemblerModel): void {
    this.editAssembler = assembler;
    this.editForm.patchValue({
      name: assembler.name,
      isActive: assembler.isActive,
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
    this.editDialogVisible = true;
  }

  confirmEdit(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message:
        'Ao editar este montador, a alteração será refletida em todas as Execuções vinculadas a ele. Deseja continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'primary' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.saveEdit(),
    });
  }

  private saveEdit(): void {
    if (!this.editAssembler || this.editForm.invalid) return;

    this.editLoading = true;
    const changes = this.editForm.getRawValue();

    this.assemblerService.update(this.editAssembler.id, changes).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Montador atualizado com sucesso!',
        });
        this.editDialogVisible = false;
        this.editLoading = false;
        this.loadAssemblers();
      },
      error: () => {
        this.editLoading = false;
      },
    });
  }

  // ── Deleção ───────────────────────────────────────────────────────────

  confirmDelete(event: Event, assembler: AssemblerModel): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Tem certeza que deseja excluir "${assembler.name}"? O montador só poderá ser excluído se não estiver vinculado em nenhuma Execução.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.deleteAssembler(assembler),
    });
  }

  private deleteAssembler(assembler: AssemblerModel): void {
    this.assemblerService.remove(assembler.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Montador excluído com sucesso!',
        });
        this.loadAssemblers();
      },
    });
  }
}
