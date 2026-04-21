import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { NgxMaskDirective } from 'ngx-mask';
import { ClientService } from '../../../shared/services/client.service';
import { ConfirmationService, FilterService, MessageService } from 'primeng/api';
import { cpfValidator } from '../../../shared/validators/cpf.validator';
import { cnpjValidator } from '../../../shared/validators/cnpj.validator';
import { Client as ClientModel } from '../../../shared/models/client.model';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { CnpjFormatPipe } from '../../../shared/pipes/cnpj-format.pipe';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';

@Component({
  selector: 'app-client',
  imports: [...SHARED_CRUD_IMPORTS, SelectButtonModule, NgxMaskDirective, PhoneFormatPipe],
  templateUrl: './client.html',
  styleUrl: './client.scss',
})
export class Client implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private filterService = inject(FilterService);

  // ── Estado ────────────────────────────────────────────────────────────

  clients: (ClientModel & { phonesText?: string })[] = [];
  loading = false;
  saving = false;

  // Dialog de edição
  editDialogVisible = false;
  editLoading = false;
  editClient: ClientModel | null = null;

  personTypeOptions = [
    { label: 'PF', value: 'F' },
    { label: 'PJ', value: 'J' },
  ];

  personTypeFilterOptions = [
    { label: 'Física', value: 'F' },
    { label: 'Jurídica', value: 'J' },
  ];

  statusOptions = [
    { label: 'Ativo', value: true },
    { label: 'Inativo', value: false },
  ];

  // Formulário de cadastro
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    personType: ['F'],
    document: ['', [cpfValidator]],
    phones: [[] as { id?: string; number: string }[]],
  });

  // Formulário de edição
  editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    personType: ['F'],
    document: [''],
    phones: [[] as { id?: string; number: string }[]],
    isActive: [true],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Filtro customizado: remove símbolos de formatação antes de comparar
    this.filterService.register('stripContains', (value: string, filter: string): boolean => {
      if (!filter) return true;
      if (!value) return false;
      const strip = (s: string) => s.replace(/[().\-\/\s]/g, '').toLowerCase();
      return strip(value).includes(strip(filter));
    });

    this.loadClients();

    this.form.controls.personType.valueChanges.subscribe(() => {
      this.updateDocumentValidator(this.form);
    });

    this.editForm.controls.personType.valueChanges.subscribe(() => {
      this.updateDocumentValidator(this.editForm);
    });
  }

  // ── Helpers de formulário ─────────────────────────────────────────────

  get personType(): string {
    return this.form.controls.personType.value;
  }

  get editPersonType(): string {
    return this.editForm.controls.personType.value;
  }

  getDocumentMask(type: string): string {
    return type === 'F' ? '000.000.000-00' : 'AA.AAA.AAA/AAAA-00';
  }

  get documentMask(): string {
    return this.getDocumentMask(this.personType);
  }

  get editDocumentMask(): string {
    return this.getDocumentMask(this.editPersonType);
  }

  get documentLabel(): string {
    return this.personType === 'F' ? 'CPF' : 'CNPJ';
  }

  get editDocumentLabel(): string {
    return this.editPersonType === 'F' ? 'CPF' : 'CNPJ';
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  isEditInvalid(field: string): boolean {
    const control = this.editForm.get(field);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  private updateDocumentValidator(formGroup: typeof this.form | typeof this.editForm): void {
    const docControl = formGroup.controls.document;
    const pt = formGroup.controls.personType.value;

    docControl.setValidators(pt === 'F' ? [cpfValidator] : [cnpjValidator]);

    if (docControl.value) {
      docControl.setValue('', { emitEvent: false });
    }
    docControl.markAsUntouched();
    docControl.updateValueAndValidity();
  }

  getPersonTypeLabel(type: string): string {
    return type === 'F' ? 'Física' : 'Jurídica';
  }

  getPersonTypeSeverity(type: string): 'info' | 'warn' {
    return type === 'F' ? 'info' : 'warn';
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Ativo' : 'Inativo';
  }

  formatDocument(client: ClientModel): string {
    if (!client.document) return '—';
    if (client.personType === 'F') {
      return new CpfFormatPipe().transform(client.document);
    }
    return new CnpjFormatPipe().transform(client.document);
  }

  /**
   * Concatena todos os telefones formatados do client para uso no filtro.
   */
  getPhonesText(client: ClientModel): string {
    const pipe = new PhoneFormatPipe();
    return client.phones.map((p) => pipe.transform(p.number)).join(' ');
  }

  // ── CRUD ──────────────────────────────────────────────────────────────

  loadClients(): void {
    this.loading = true;
    this.clientService.findAll().subscribe({
      next: (clients) => {
        this.clients = clients.map((c) => ({
          ...c,
          phonesText: (c.phones ?? []).map((p) => p.number).join(' '),
        }));
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
    const payload = {
      ...raw,
      document: raw.document ? raw.document.toUpperCase() : raw.document,
    };

    this.clientService.create(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Cliente cadastrado com sucesso!',
        });
        this.form.reset({ name: '', personType: 'F', document: '', phones: [] });
        this.saving = false;
        this.loadClients();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // ── Edição ────────────────────────────────────────────────────────────

  openEditDialog(client: ClientModel): void {
    this.editClient = client;

    // Seta o validador correto antes de patchValue
    const validator = client.personType === 'F' ? cpfValidator : cnpjValidator;
    this.editForm.controls.document.setValidators([validator]);

    this.editForm.patchValue({
      name: client.name,
      personType: client.personType,
      document: client.document ?? '',
      isActive: client.isActive,
      phones: client.phones.map((p) => ({ id: p.id, number: p.number })),
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
    this.editDialogVisible = true;
  }

  confirmEdit(event: Event): void {
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
      accept: () => this.saveEdit(),
    });
  }

  private saveEdit(): void {
    if (!this.editClient || this.editForm.invalid) return;

    this.editLoading = true;
    const raw = this.editForm.getRawValue();

    const payload = {
      name: raw.name,
      personType: raw.personType,
      document: raw.document ? raw.document.toUpperCase() : null,
      isActive: raw.isActive,
      phones: raw.phones,
    };

    this.clientService.update(this.editClient.id, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Cliente atualizado com sucesso!',
        });
        this.editDialogVisible = false;
        this.editLoading = false;
        this.loadClients();
      },
      error: () => {
        this.editLoading = false;
      },
    });
  }

  // ── Deleção ───────────────────────────────────────────────────────────

  confirmDelete(event: Event, client: ClientModel): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Tem certeza que deseja excluir "${client.name}"? O cliente só poderá ser excluído se não estiver vinculado em nenhuma Ordem de Serviço.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.deleteClient(client),
    });
  }

  private deleteClient(client: ClientModel): void {
    this.clientService.remove(client.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Cliente excluído com sucesso!',
        });
        this.loadClients();
      },
    });
  }
}
