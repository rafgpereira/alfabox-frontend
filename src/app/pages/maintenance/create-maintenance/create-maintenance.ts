import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, switchMap, of } from 'rxjs';
import { Location, CurrencyPipe } from '@angular/common';
import { ClientService } from '../../../shared/services/client.service';
import { ServiceOrderService } from '../../../shared/services/service-order.service';
import {
  MaintenanceService,
  CreateMaintenancePayload,
} from '../../../shared/services/maintenance.service';
import { Client, ClientPhone } from '../../../shared/models/client.model';
import {
  ServiceOrderAddress,
  ServiceOrderLookup,
} from '../../../shared/models/service-order.model';
import { ClientDialogComponent } from '../../../shared/components/client-dialog/client-dialog';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { CnpjFormatPipe } from '../../../shared/pipes/cnpj-format.pipe';
import { PhoneFormatPipe } from '../../../shared/pipes/phone-format.pipe';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';
import { todayLocal, toApiDate } from '../../../shared/utils/date.utils';
import { sumCurrency } from '../../../shared/utils/money.utils';
import { InputNumberModule } from 'primeng/inputnumber';
import { Router } from '@angular/router';

type MaintenanceType = 'NORMAL' | 'WARRANTY';

@Component({
  selector: 'app-create-maintenance',
  imports: [...SHARED_CRUD_IMPORTS, ClientDialogComponent, InputNumberModule, CurrencyPipe],
  templateUrl: './create-maintenance.html',
  styleUrl: './create-maintenance.scss',
})
export class CreateMaintenance implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private serviceOrderService = inject(ServiceOrderService);
  private maintenanceService = inject(MaintenanceService);
  private messageService = inject(MessageService);
  private location = inject(Location);
  private router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  return(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else if (this._originServiceOrderCode) {
      this.router.navigate(['/os', this._originServiceOrderCode]);
    } else {
      this.router.navigate(['/manutencao']);
    }
  }

  // ── Tipo de manutenção ────────────────────────────────────────────────

  readonly typeOptions: { label: string; value: MaintenanceType }[] = [
    { label: 'Padrão', value: 'NORMAL' },
    { label: 'Garantia', value: 'WARRANTY' },
  ];

  selectedType: MaintenanceType = 'NORMAL';

  // Código da OS de origem (preenchido pelo router state — usado no return e no redirect pós-salvar)
  private _originServiceOrderCode: string | null = null;

  onTypeChange(value: MaintenanceType): void {
    this.selectedType = value;
    // Re-sincroniza validadores ao trocar o tipo
    if (this.hasProduct) {
      this._syncProductValidators(true);
    }
    this._syncLaborValidator();
  }

  // ── Formulário ────────────────────────────────────────────────────────

  form = this.fb.nonNullable.group({
    clientId: ['', Validators.required],
    serviceOrderId: [null as string | null],
    maintenanceDate: [todayLocal(), Validators.required],
    street: ['', Validators.maxLength(255)],
    addressNumber: ['', Validators.maxLength(50)],
    neighborhood: ['', Validators.maxLength(100)],
    complement: ['', Validators.maxLength(100)],
    city: ['', Validators.maxLength(100)],
    // ── Produto (ativado pelo toggle) ────────────────────────────────────
    productDescription: [null as string | null],
    productAmount: [null as number | null],
    // ── Mão de obra e observação ─────────────────────────────────────────
    laborAmount: [null as number | null],
    observation: [null as string | null, Validators.maxLength(500)],
  });

  // ── OS vinculada (autocomplete) ───────────────────────────────────────

  selectedServiceOrder: ServiceOrderLookup | null = null;
  serviceOrderSuggestions: ServiceOrderLookup[] = [];
  private soSearchSubject = new Subject<string>();

  searchServiceOrders(event: AutoCompleteCompleteEvent): void {
    const clientId = this.selectedClient?.id;
    if (clientId) {
      // Se há cliente, filtra pelo clientId (dropdown)
      this.serviceOrderService.lookup(clientId, event.query || undefined).subscribe({
        next: (results) => (this.serviceOrderSuggestions = results),
      });
    } else {
      // Sem cliente: busca por código via debounce
      this.soSearchSubject.next(event.query);
    }
  }

  onServiceOrderSelect(event: { value: ServiceOrderLookup }): void {
    const so = event.value;
    this.selectedServiceOrder = so;
    this.form.controls.serviceOrderId.setValue(so.id, { emitEvent: false });

    // Sempre sobrescreve o endereço com o da OS selecionada
    this.form.patchValue(
      {
        street: so.street ?? '',
        addressNumber: so.addressNumber ?? '',
        neighborhood: so.neighborhood ?? '',
        complement: so.complement ?? '',
        city: so.city ?? '',
      },
      { emitEvent: false },
    );

    // Troca de cliente se necessário
    if (!this.selectedClient || this.selectedClient.id !== so.clientId) {
      this.clientService.findById(so.clientId).subscribe({
        next: (client) => {
          this.selectedClient = client;
          this.form.controls.clientId.setValue(client.id, { emitEvent: false });
          this.loadClientAddresses(client.id);
        },
      });
    }
  }

  onServiceOrderClear(): void {
    this.selectedServiceOrder = null;
    this.form.controls.serviceOrderId.setValue(null, { emitEvent: false });
  }

  serviceOrderLabel(so: ServiceOrderLookup): string {
    return so.code;
  }

  // ── Cliente (autocomplete) ────────────────────────────────────────────

  selectedClient: Client | null = null;
  clientSuggestions: Client[] = [];
  clientSearchQuery = '';
  private searchSubject = new Subject<string>();

  // ── Endereço (autocomplete de histórico) ──────────────────────────────

  private clientAddresses: ServiceOrderAddress[] = [];
  addressSuggestions: ServiceOrderAddress[] = [];

  // ── Dialog criar/editar cliente ───────────────────────────────────────

  clientDialogVisible = false;
  clientDialogMode: 'create' | 'edit' = 'create';

  // ── Toggle produto ────────────────────────────────────────────────────

  hasProduct = false;

  onToggleProduct(active: boolean): void {
    this.hasProduct = active;
    this._syncProductValidators(active);
    if (!active) {
      this.form.patchValue({ productDescription: null, productAmount: null });
    }
  }

  private _syncProductValidators(active: boolean): void {
    const { productDescription, productAmount } = this.form.controls;
    if (active) {
      productDescription.setValidators([Validators.required, Validators.maxLength(500)]);
      if (this.selectedType === 'NORMAL') {
        productAmount.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        productAmount.clearValidators();
        productAmount.setValue(null);
      }
    } else {
      productDescription.clearValidators();
      productAmount.clearValidators();
    }
    productDescription.updateValueAndValidity();
    productAmount.updateValueAndValidity();
  }

  private _syncLaborValidator(): void {
    const { laborAmount } = this.form.controls;
    if (this.selectedType === 'NORMAL') {
      laborAmount.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      laborAmount.clearValidators();
      laborAmount.setValue(null);
    }
    laborAmount.updateValueAndValidity();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap((query) => {
          if (!query || query.length < 1) return of([]);
          return this.clientService.findAll(true, query);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((clients) => {
        this.clientSuggestions = clients;
      });

    // Busca de OS por código (sem cliente selecionado)
    this.soSearchSubject
      .pipe(
        debounceTime(300),
        switchMap((query) => {
          if (!query || query.length < 1) return of([]);
          return this.serviceOrderService.lookup(undefined, query);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.serviceOrderSuggestions = results;
      });

    // Inicializa validadores conforme o tipo padrão (NORMAL)
    this._syncLaborValidator();

    // Pré-carrega dados vindos da tela de detalhes de OS (router state)
    this._prefillFromRouterState();
  }

  private _prefillFromRouterState(): void {
    const state = history.state as {
      serviceOrder?: ServiceOrderLookup;
      client?: Client;
    } | null;

    if (!state?.serviceOrder) return;

    const so = state.serviceOrder;
    const client = state.client ?? null;

    // Seta OS
    this.selectedServiceOrder = so;
    this.form.controls.serviceOrderId.setValue(so.id, { emitEvent: false });

    // Seta endereço
    this.form.patchValue(
      {
        street: so.street ?? '',
        addressNumber: so.addressNumber ?? '',
        neighborhood: so.neighborhood ?? '',
        complement: so.complement ?? '',
        city: so.city ?? '',
      },
      { emitEvent: false },
    );

    // Seta cliente
    if (client) {
      this.selectedClient = client;
      this.form.controls.clientId.setValue(client.id, { emitEvent: false });
      this.loadClientAddresses(client.id);
    }

    // Quando vem de uma OS, pré-seleciona Garantia e guarda o código de origem
    this._originServiceOrderCode = so.code;
    this.selectedType = 'WARRANTY';
    this._syncLaborValidator();
  }

  // ── Valor total calculado (apenas visual) ─────────────────────────────

  get computedTotal(): number {
    const product = Number(this.form.controls.productAmount.value) || 0;
    const labor = Number(this.form.controls.laborAmount.value) || 0;
    return sumCurrency([product, labor]);
  }

  // ── Autocomplete handlers ─────────────────────────────────────────────

  searchClients(event: AutoCompleteCompleteEvent): void {
    this.clientSearchQuery = event.query;
    this.searchSubject.next(event.query);
  }

  onClientSelect(event: { value: Client }): void {
    const prev = this.selectedClient;
    this.selectedClient = event.value;
    this.clientSearchQuery = '';
    this.form.controls.clientId.setValue(event.value.id);
    this.loadClientAddresses(event.value.id);
    // Limpa OS vinculada se o cliente mudou
    if (prev && prev.id !== event.value.id) {
      this.selectedServiceOrder = null;
      this.form.controls.serviceOrderId.setValue(null, { emitEvent: false });
    }
  }

  onClientClear(): void {
    this.selectedClient = null;
    this.clientSearchQuery = '';
    this.form.controls.clientId.setValue('');
    this.clientAddresses = [];
    this.addressSuggestions = [];
    this.selectedServiceOrder = null;
    this.form.controls.serviceOrderId.setValue(null, { emitEvent: false });
  }

  removeClient(): void {
    this.selectedClient = null;
    this.clientSearchQuery = '';
    this.form.controls.clientId.setValue('');
    this.clientAddresses = [];
    this.addressSuggestions = [];
    this.selectedServiceOrder = null;
    this.form.controls.serviceOrderId.setValue(null, { emitEvent: false });
  }

  // ── Endereço handlers ─────────────────────────────────────────────────

  private loadClientAddresses(clientId: string): void {
    this.serviceOrderService.getAddressesByClient(clientId).subscribe({
      next: (addresses) => {
        this.clientAddresses = addresses;
      },
    });
  }

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

  addressSuggestionLabel(addr: ServiceOrderAddress): string {
    return [addr.street, addr.addressNumber, addr.complement, addr.neighborhood, addr.city]
      .filter(Boolean)
      .join(', ');
  }

  // ── Dialog de cliente ─────────────────────────────────────────────────

  openCreateClientDialog(): void {
    this.clientDialogMode = 'create';
    this.clientDialogVisible = true;
  }

  openEditClientDialog(): void {
    if (!this.selectedClient) return;
    this.clientDialogMode = 'edit';
    this.clientDialogVisible = true;
  }

  onClientSaved(client: Client): void {
    this.selectedClient = client;
    this.form.controls.clientId.setValue(client.id);
    this.loadClientAddresses(client.id);
  }

  // ── Submit ────────────────────────────────────────────────────────────

  isSubmitting = false;

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const isNormal = this.selectedType === 'NORMAL';

    const payload: CreateMaintenancePayload = {
      type: this.selectedType,
      clientId: raw.clientId,
      serviceOrderId: this.selectedServiceOrder?.id ?? null,
      maintenanceDate: toApiDate(raw.maintenanceDate),
      observation: raw.observation || null,
      street: raw.street || null,
      addressNumber: raw.addressNumber || null,
      neighborhood: raw.neighborhood || null,
      complement: raw.complement || null,
      city: raw.city || null,
      productDescription: this.hasProduct ? raw.productDescription || null : null,
      productAmount: this.hasProduct && isNormal ? raw.productAmount : null,
      laborAmount: isNormal ? raw.laborAmount : null,
    };

    this.isSubmitting = true;
    this.maintenanceService.create(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Manutenção cadastrada com sucesso!',
        });
        this.router.navigate(['/manutencao']);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

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
