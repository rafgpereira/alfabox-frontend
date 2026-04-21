import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { InputMaskModule } from 'primeng/inputmask';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Seller as SellerModel } from '../../../shared/models/seller.model';
import { SellerService } from '../../../shared/services/seller.service';
import { cpfValidator } from '../../../shared/validators/cpf.validator';
import { CpfFormatPipe } from '../../../shared/pipes/cpf-format.pipe';
import { SHARED_CRUD_IMPORTS } from '../../../shared/constants/shared-crud-imports';

@Component({
  selector: 'app-seller',
  imports: [...SHARED_CRUD_IMPORTS, InputMaskModule, CpfFormatPipe],
  templateUrl: './seller.html',
  styleUrl: './seller.scss',
})
export class Seller implements OnInit {
  private fb = inject(FormBuilder);
  private sellerService = inject(SellerService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── Estado ────────────────────────────────────────────────────────────

  sellers: SellerModel[] = [];
  loading = false;
  saving = false;

  // Dialog de edição
  editDialogVisible = false;
  editLoading = false;
  editSeller: SellerModel | null = null;

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
    this.loadSellers();
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

  loadSellers(): void {
    this.loading = true;
    this.sellerService.findAll().subscribe({
      next: (sellers) => {
        this.sellers = sellers;
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

    this.sellerService.create(raw).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Vendedor cadastrado com sucesso!',
        });
        this.form.reset();
        this.saving = false;
        this.loadSellers();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // ── Edição ────────────────────────────────────────────────────────────

  openEditDialog(seller: SellerModel): void {
    this.editSeller = seller;
    this.editForm.patchValue({
      name: seller.name,
      isActive: seller.isActive,
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
    this.editDialogVisible = true;
  }

  confirmEdit(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message:
        'Ao editar este vendedor, a alteração será refletida em todas as Ordens de Serviço vinculadas a ele. Deseja continuar?',
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
    if (!this.editSeller || this.editForm.invalid) return;

    this.editLoading = true;
    const changes = this.editForm.getRawValue();

    this.sellerService.update(this.editSeller.id, changes).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Vendedor atualizado com sucesso!',
        });
        this.editDialogVisible = false;
        this.editLoading = false;
        this.loadSellers();
      },
      error: () => {
        this.editLoading = false;
      },
    });
  }

  // ── Deleção ───────────────────────────────────────────────────────────

  confirmDelete(event: Event, seller: SellerModel): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Tem certeza que deseja excluir "${seller.name}"? O vendedor só poderá ser excluído se não estiver vinculado em nenhuma Ordem de Serviço.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.deleteSeller(seller),
    });
  }

  private deleteSeller(seller: SellerModel): void {
    this.sellerService.remove(seller.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Vendedor excluído com sucesso!',
        });
        this.loadSellers();
      },
    });
  }
}
