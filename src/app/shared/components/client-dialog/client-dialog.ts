import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectButtonModule } from 'primeng/selectbutton';
import { NgxMaskDirective } from 'ngx-mask';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';
import { cpfValidator } from '../../validators/cpf.validator';
import { cnpjValidator } from '../../validators/cnpj.validator';

export type ClientDialogMode = 'create' | 'edit';

@Component({
  selector: 'app-client-dialog',
  standalone: true,
  imports: [...SHARED_CRUD_IMPORTS, SelectButtonModule, NgxMaskDirective],
  templateUrl: './client-dialog.html',
  styleUrl: './client-dialog.scss',
})
export class ClientDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // ── Inputs / Outputs ──────────────────────────────────────────────────

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Modo de operação do dialog. */
  @Input() mode: ClientDialogMode = 'create';

  /** Cliente a editar — obrigatório quando mode === 'edit'. */
  @Input() client: Client | null = null;

  /**
   * Exibe o toggle Ativo/Inativo no formulário de edição.
   * Use `true` em contextos onde faz sentido inativar o cliente
   * (ex: tela de clientes, detalhes da OS).
   * Use `false` quando a inativação seria incoerente com o fluxo
   * (ex: formulário de criação de OS — não faz sentido inativar quem está sendo selecionado).
   */
  @Input() allowStatusToggle = false;

  /**
   * Nome pré-preenchido ao abrir no modo criação.
   * Útil quando o usuário digita um nome no autocomplete que não existe ainda.
   */
  @Input() initialName = '';

  /** Emite o cliente criado ou atualizado após salvar com sucesso. */
  @Output() saved = new EventEmitter<Client>();

  // ── Estado interno ────────────────────────────────────────────────────

  saving = false;

  readonly personTypeOptions = [
    { label: 'PF', value: 'F' },
    { label: 'PJ', value: 'J' },
  ];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    personType: ['F'],
    document: ['', [cpfValidator]],
    phones: [[] as { id?: string; number: string }[]],
    isActive: [true],
  });

  // ── Computed ──────────────────────────────────────────────────────────

  get header(): string {
    return this.mode === 'create' ? 'Cadastrar Cliente' : 'Editar Cliente';
  }

  get personType(): string {
    return this.form.controls.personType.value;
  }

  get documentMask(): string {
    return this.personType === 'F' ? '000.000.000-00' : 'AA.AAA.AAA/AAAA-00';
  }

  get documentLabel(): string {
    return this.personType === 'F' ? 'CPF' : 'CNPJ';
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return ctrl ? ctrl.invalid && (ctrl.touched || ctrl.dirty) : false;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnChanges(): void {
    if (this.visible) {
      this.initForm();
    }
  }

  private initForm(): void {
    if (this.mode === 'edit' && this.client) {
      const validator = this.client.personType === 'F' ? cpfValidator : cnpjValidator;
      this.form.controls.document.setValidators([validator]);

      this.form.patchValue({
        name: this.client.name,
        personType: this.client.personType,
        document: this.client.document ?? '',
        phones: this.client.phones.map((p) => ({ id: p.id, number: p.number })),
        isActive: this.client.isActive,
      });
    } else {
      this.form.controls.document.setValidators([cpfValidator]);

      this.form.reset({
        name: this.initialName,
        personType: 'F',
        document: '',
        phones: [],
        isActive: true,
      });
    }

    this.form.controls.document.updateValueAndValidity();
    this.form.markAsPristine();
    this.form.markAsUntouched();

    // Atualiza validator do documento quando o tipo de pessoa muda
    this.form.controls.personType.valueChanges.subscribe(() => {
      this.updateDocumentValidator();
    });
  }

  private updateDocumentValidator(): void {
    const docControl = this.form.controls.document;
    const pt = this.form.controls.personType.value;
    docControl.setValidators(pt === 'F' ? [cpfValidator] : [cnpjValidator]);
    if (docControl.value) {
      docControl.setValue('', { emitEvent: false });
    }
    docControl.markAsUntouched();
    docControl.updateValueAndValidity();
  }

  // ── Ações ─────────────────────────────────────────────────────────────

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  save(event: Event): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    if (this.mode === 'edit') {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message:
          'Ao editar este cliente, a alteração será refletida em todas as Ordens de Serviço vinculadas a ele. Deseja continuar?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Confirmar',
        rejectLabel: 'Cancelar',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptButtonProps: { severity: 'primary' },
        rejectButtonProps: { severity: 'secondary', outlined: true },
        accept: () => this.executeSave(),
      });
    } else {
      this.executeSave();
    }
  }

  private executeSave(): void {
    this.saving = true;
    const raw = this.form.getRawValue();

    const basePayload = {
      name: raw.name,
      personType: raw.personType,
      document: raw.document ? raw.document.toUpperCase() : null,
      phones: raw.phones,
    };

    if (this.mode === 'create') {
      this.clientService.create(basePayload).subscribe({
        next: (created) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Cliente cadastrado com sucesso!',
          });
          this.saving = false;
          this.close();
          this.saved.emit(created);
        },
        error: () => {
          this.saving = false;
        },
      });
    } else {
      const updatePayload = this.allowStatusToggle
        ? { ...basePayload, isActive: raw.isActive }
        : basePayload;

      this.clientService.update(this.client!.id, updatePayload).subscribe({
        next: (updated) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Cliente atualizado com sucesso!',
          });
          this.saving = false;
          this.close();
          this.saved.emit(updated);
        },
        error: () => {
          this.saving = false;
        },
      });
    }
  }
}
