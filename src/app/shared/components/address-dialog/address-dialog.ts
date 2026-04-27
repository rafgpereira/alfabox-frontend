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
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { ServiceOrderService } from '../../services/service-order.service';
import { ServiceOrderAddress, UpdateAddress } from '../../models/service-order.model';

@Component({
  selector: 'app-address-dialog',
  standalone: true,
  imports: [...SHARED_CRUD_IMPORTS],
  templateUrl: './address-dialog.html',
  styleUrl: './address-dialog.scss',
})
export class AddressDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly serviceOrderService = inject(ServiceOrderService);
  private readonly messageService = inject(MessageService);

  // ── Inputs / Outputs ──────────────────────────────────────────────────

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** UUID da OS — obrigatório para o PATCH. */
  @Input() orderId = '';

  /** Dados atuais do endereço para pré-preencher o formulário. */
  @Input() address: ServiceOrderAddress | null = null;

  /** Emite o novo endereço após salvar com sucesso. */
  @Output() saved = new EventEmitter<ServiceOrderAddress>();

  // ── Estado interno ────────────────────────────────────────────────────

  saving = false;

  readonly form = this.fb.group({
    street: ['', [Validators.maxLength(255)]],
    addressNumber: ['', [Validators.maxLength(50)]],
    complement: ['', [Validators.maxLength(100)]],
    neighborhood: ['', [Validators.maxLength(100)]],
    city: ['', [Validators.maxLength(100)]],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.form.reset({
        street: this.address?.street ?? '',
        addressNumber: this.address?.addressNumber ?? '',
        complement: this.address?.complement ?? '',
        neighborhood: this.address?.neighborhood ?? '',
        city: this.address?.city ?? '',
      });
    }
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

    const v = this.form.getRawValue();

    /** Converte string vazia → null para o backend. */
    const toNull = (s: string | null): string | null => s?.trim() || null;

    const payload: UpdateAddress = {
      street: toNull(v.street),
      addressNumber: toNull(v.addressNumber),
      complement: toNull(v.complement),
      neighborhood: toNull(v.neighborhood),
      city: toNull(v.city),
    };

    this.saving = true;
    this.serviceOrderService.updateAddress(this.orderId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Endereço atualizado',
          detail: 'Os dados de endereço foram salvos com sucesso.',
        });
        this.saved.emit({
          street: payload.street,
          addressNumber: payload.addressNumber,
          neighborhood: payload.neighborhood,
          complement: payload.complement,
          city: payload.city,
        });
        this.close();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível salvar o endereço. Tente novamente.',
        });
      },
    });
  }
}
