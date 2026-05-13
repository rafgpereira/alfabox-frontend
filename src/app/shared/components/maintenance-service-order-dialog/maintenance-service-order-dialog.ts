import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { MaintenanceService } from '../../services/maintenance.service';
import { ServiceOrderService } from '../../services/service-order.service';
import { ServiceOrderLookup } from '../../models/service-order.model';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

@Component({
  selector: 'app-maintenance-service-order-dialog',
  standalone: true,
  imports: [...SHARED_CRUD_IMPORTS],
  templateUrl: './maintenance-service-order-dialog.html',
  styleUrl: './maintenance-service-order-dialog.scss',
})
export class MaintenanceServiceOrderDialogComponent implements OnChanges, OnInit {
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly serviceOrderService = inject(ServiceOrderService);
  private readonly messageService = inject(MessageService);

  // ── Inputs / Outputs ──────────────────────────────────────────────────

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** UUID da manutenção a ser atualizada. */
  @Input() maintenanceId = '';

  /** UUID do cliente (filtra as OS disponíveis). */
  @Input() clientId = '';

  /** OS atualmente vinculada (para pré-preencher). */
  @Input() currentServiceOrder: ServiceOrderLookup | null = null;

  /** Emite a OS selecionada (ou null se removida) após salvar com sucesso. */
  @Output() saved = new EventEmitter<ServiceOrderLookup | null>();

  // ── Estado interno ────────────────────────────────────────────────────

  selectedServiceOrder: ServiceOrderLookup | null = null;
  private allServiceOrders: ServiceOrderLookup[] = [];
  suggestions: ServiceOrderLookup[] = [];
  saving = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.serviceOrderService.lookup(this.clientId).subscribe({
      next: (list) => (this.allServiceOrders = list),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.selectedServiceOrder = this.currentServiceOrder ?? null;
      this.suggestions = [...this.allServiceOrders];
    }
  }

  // ── Autocomplete ──────────────────────────────────────────────────────

  search(event: AutoCompleteCompleteEvent): void {
    const query = event.query.trim().toLowerCase();
    if (!query) {
      this.suggestions = [...this.allServiceOrders];
      return;
    }
    this.suggestions = this.allServiceOrders.filter((so: ServiceOrderLookup) =>
      so.code.toLowerCase().includes(query),
    );
  }

  serviceOrderLabel(so: ServiceOrderLookup): string {
    return so.code;
  }

  clear(): void {
    this.selectedServiceOrder = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  close(): void {
    this.visibleChange.emit(false);
  }

  // ── Salvar ────────────────────────────────────────────────────────────

  save(): void {
    this.saving = true;
    const serviceOrderId = this.selectedServiceOrder?.id ?? null;
    this.maintenanceService.updateServiceOrder(this.maintenanceId, { serviceOrderId }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'OS de origem atualizada com sucesso!',
        });
        this.saving = false;
        this.visibleChange.emit(false);
        this.saved.emit(this.selectedServiceOrder);
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
