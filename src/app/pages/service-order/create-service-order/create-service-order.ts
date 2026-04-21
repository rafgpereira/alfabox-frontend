import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  AutoCompleteModule,
  AutoCompleteCompleteEvent,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { NgxMaskDirective } from 'ngx-mask';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, switchMap, of } from 'rxjs';
import { ClientService } from '../../../shared/services/client.service';
import { ServiceOrderService } from '../../../shared/services/service-order.service';
import { Client, ClientPhone } from '../../../shared/models/client.model';
import { ServiceOrderAddress } from '../../../shared/models/service-order.model';
import { cpfValidator } from '../../../shared/validators/cpf.validator';
import { cnpjValidator } from '../../../shared/validators/cnpj.validator';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { CnpjFormatPipe } from '../../../shared/pipes/cnpj-format.pipe';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';

@Component({
  selector: 'app-create-service-order',
  imports: [...SHARED_CRUD_IMPORTS, AutoCompleteModule, SelectButtonModule, NgxMaskDirective],
  templateUrl: './create-service-order.html',
  styleUrl: './create-service-order.scss',
})
export class CreateServiceOrder implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private serviceOrderService = inject(ServiceOrderService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── Formulário principal da OS ────────────────────────────────────────

  form = this.fb.nonNullable.group({
    clientId: ['', Validators.required],
    street: ['', Validators.maxLength(255)],
    addressNumber: ['', Validators.maxLength(50)],
    neighborhood: ['', Validators.maxLength(100)],
    complement: ['', Validators.maxLength(100)],
    city: ['', Validators.maxLength(100)],
  });

  // ── Cliente (autocomplete) ────────────────────────────────────────────

  selectedClient: Client | null = null;
  clientSuggestions: Client[] = [];
  clientSearchQuery = '';
  private searchSubject = new Subject<string>();

  // ── Endereço (autocomplete de histórico) ──────────────────────────────

  /** Lista completa de endereços do cliente selecionado, carregada uma vez ao selecionar o cliente. */
  private clientAddresses: ServiceOrderAddress[] = [];
  /** Sugestões filtradas em tempo real conforme o usuário digita na rua. */
  addressSuggestions: ServiceOrderAddress[] = [];

  // ── Dialog criar/editar cliente ───────────────────────────────────────

  clientDialogVisible = false;
  clientDialogMode: 'create' | 'edit' = 'create';
  clientDialogLoading = false;

  personTypeOptions = [
    { label: 'PF', value: 'F' },
    { label: 'PJ', value: 'J' },
  ];

  clientForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    personType: ['F'],
    document: ['', [cpfValidator]],
    phones: [[] as { id?: string; number: string }[]],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap((query) => {
          if (!query || query.length < 1) return of([]);
          return this.clientService.findAll(true, query);
        }),
      )
      .subscribe((clients) => {
        this.clientSuggestions = clients;
      });

    this.clientForm.controls.personType.valueChanges.subscribe(() => {
      this.updateDocumentValidator();
    });
  }

  // ── Autocomplete handlers ─────────────────────────────────────────────

  searchClients(event: AutoCompleteCompleteEvent): void {
    this.clientSearchQuery = event.query;
    this.searchSubject.next(event.query);
  }

  onClientSelect(event: { value: Client }): void {
    this.selectedClient = event.value;
    this.clientSearchQuery = '';
    this.form.controls.clientId.setValue(event.value.id);
    this.loadClientAddresses(event.value.id);
  }

  onClientClear(): void {
    this.selectedClient = null;
    this.clientSearchQuery = '';
    this.form.controls.clientId.setValue('');
    this.clientAddresses = [];
    this.addressSuggestions = [];
  }

  removeClient(): void {
    this.selectedClient = null;
    this.clientSearchQuery = '';
    this.form.controls.clientId.setValue('');
    this.clientAddresses = [];
    this.addressSuggestions = [];
  }

  // ── Endereço handlers ─────────────────────────────────────────────────

  private loadClientAddresses(clientId: string): void {
    this.serviceOrderService.getAddressesByClient(clientId).subscribe({
      next: (addresses) => {
        this.clientAddresses = addresses;
      },
    });
  }

  /**
   * Filtra os endereços do cliente comparando a query com TODOS os campos
   * (comportamento análogo a um ILIKE sobre a concatenação dos campos).
   */
  searchAddresses(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase().trim();
    if (!query) {
      this.addressSuggestions = [...this.clientAddresses];
      return;
    }
    this.addressSuggestions = this.clientAddresses.filter((addr) => {
      const haystack = [
        addr.street,
        addr.addressNumber,
        addr.neighborhood,
        addr.complement,
        addr.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  /** Preenche todos os campos de endereço quando o usuário seleciona uma sugestão. */
  onAddressSelect(event: AutoCompleteSelectEvent): void {
    const addr: ServiceOrderAddress = event.value;
    this.form.patchValue({
      street: addr.street ?? '',
      addressNumber: addr.addressNumber ?? '',
      neighborhood: addr.neighborhood ?? '',
      complement: addr.complement ?? '',
      city: addr.city ?? '',
    });
  }

  /** Label concatenado exibido nas sugestões do autocomplete de endereço. */
  addressSuggestionLabel(addr: ServiceOrderAddress): string {
    return [addr.street, addr.addressNumber, addr.complement, addr.neighborhood, addr.city]
      .filter(Boolean)
      .join(', ');
  }

  // ── Dialog de cliente ─────────────────────────────────────────────────

  openCreateClientDialog(): void {
    this.clientDialogMode = 'create';
    this.clientForm.reset({
      name: this.clientSearchQuery,
      personType: 'F',
      document: '',
      phones: [],
    });
    this.clientForm.controls.document.setValidators([cpfValidator]);
    this.clientForm.controls.document.updateValueAndValidity();
    this.clientForm.markAsPristine();
    this.clientForm.markAsUntouched();
    this.clientDialogVisible = true;
  }

  openEditClientDialog(): void {
    if (!this.selectedClient) return;
    this.clientDialogMode = 'edit';

    const validator = this.selectedClient.personType === 'F' ? cpfValidator : cnpjValidator;
    this.clientForm.controls.document.setValidators([validator]);

    this.clientForm.patchValue({
      name: this.selectedClient.name,
      personType: this.selectedClient.personType,
      document: this.selectedClient.document ?? '',
      phones: this.selectedClient.phones.map((p) => ({ id: p.id, number: p.number })),
    });
    this.clientForm.markAsPristine();
    this.clientForm.markAsUntouched();
    this.clientDialogVisible = true;
  }

  saveClient(event?: Event): void {
    if (this.clientForm.invalid) return;

    if (this.clientDialogMode === 'edit') {
      this.confirmationService.confirm({
        target: event?.target as EventTarget,
        message:
          'Ao editar este cliente, a alteração será refletida em todas as Ordens de Serviço vinculadas a ele. Deseja continuar?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Confirmar',
        rejectLabel: 'Cancelar',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptButtonProps: { severity: 'primary' },
        rejectButtonProps: { severity: 'secondary', outlined: true },
        accept: () => this.executeSaveClient(),
      });
    } else {
      this.executeSaveClient();
    }
  }

  private executeSaveClient(): void {
    this.clientDialogLoading = true;

    const raw = this.clientForm.getRawValue();
    const payload = {
      name: raw.name,
      personType: raw.personType,
      document: raw.document ? raw.document.toUpperCase() : null,
      phones: raw.phones,
    };

    if (this.clientDialogMode === 'create') {
      this.clientService.create(payload).subscribe({
        next: (created) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Cliente criado com sucesso!',
          });
          this.selectedClient = created;
          this.clientDialogVisible = false;
          this.clientDialogLoading = false;
        },
        error: () => {
          this.clientDialogLoading = false;
        },
      });
    } else {
      this.clientService.update(this.selectedClient!.id, payload).subscribe({
        next: (updated) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Cliente atualizado com sucesso!',
          });
          this.selectedClient = updated;
          this.clientDialogVisible = false;
          this.clientDialogLoading = false;
        },
        error: () => {
          this.clientDialogLoading = false;
        },
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  get clientDialogHeader(): string {
    return this.clientDialogMode === 'create' ? 'Cadastrar Cliente' : 'Editar Cliente';
  }

  get dialogPersonType(): string {
    return this.clientForm.controls.personType.value;
  }

  get dialogDocumentMask(): string {
    return this.dialogPersonType === 'F' ? '000.000.000-00' : 'AA.AAA.AAA/AAAA-00';
  }

  get dialogDocumentLabel(): string {
    return this.dialogPersonType === 'F' ? 'CPF' : 'CNPJ';
  }

  isDialogInvalid(field: string): boolean {
    const control = this.clientForm.get(field);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  private updateDocumentValidator(): void {
    const docControl = this.clientForm.controls.document;
    const pt = this.clientForm.controls.personType.value;
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

  getDocumentSeverity(client: Client): 'secondary' | 'danger' {
    return client.document ? 'secondary' : 'danger';
  }

  formatDocument(client: Client): string {
    if (!client.document) return 'Não cadastrado';
    if (client.personType === 'F') {
      return new CpfFormatPipe().transform(client.document);
    }
    return new CnpjFormatPipe().transform(client.document);
  }

  formatPhone(phone: ClientPhone): string {
    return new PhoneFormatPipe().transform(phone.number);
  }
}
