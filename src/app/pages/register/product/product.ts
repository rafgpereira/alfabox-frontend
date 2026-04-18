import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message';
import { ProductService } from '../../../shared/services/product.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Product as ProductModel } from '../../../shared/models/product.model';

@Component({
  selector: 'app-product',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    ErrorMessageComponent,
    TableModule,
    TagModule,
    Dialog,
    ToggleSwitch,
    SelectModule,
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── Estado ────────────────────────────────────────────────────────────

  products: ProductModel[] = [];
  loading = false;
  saving = false;

  // Dialog de edição
  editDialogVisible = false;
  editLoading = false;
  editProduct: ProductModel | null = null;

  editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    isActive: [true],
  });

  // Formulário de cadastro
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
  });

  // Opções do filtro de status
  statusOptions = [
    { label: 'Ativo', value: true },
    { label: 'Inativo', value: false },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadProducts();
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

  loadProducts(): void {
    this.loading = true;
    this.productService.findAll().subscribe({
      next: (products) => {
        this.products = products;
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
    this.productService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Produto cadastrado com sucesso!',
        });
        this.form.reset();
        this.saving = false;
        this.loadProducts();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // ── Edição ────────────────────────────────────────────────────────────

  openEditDialog(product: ProductModel): void {
    this.editProduct = product;
    this.editForm.patchValue({
      name: product.name,
      isActive: product.isActive,
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
    this.editDialogVisible = true;
  }

  confirmEdit(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message:
        'Ao editar este produto, a alteração será refletida em todas as Ordens de Serviço vinculadas a ele. Deseja continuar?',
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
    if (!this.editProduct || this.editForm.invalid) return;

    this.editLoading = true;
    const changes = this.editForm.getRawValue();

    this.productService.update(this.editProduct.id, changes).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Produto atualizado com sucesso!',
        });
        this.editDialogVisible = false;
        this.editLoading = false;
        this.loadProducts();
      },
      error: () => {
        this.editLoading = false;
      },
    });
  }

  // ── Deleção ───────────────────────────────────────────────────────────

  confirmDelete(event: Event, product: ProductModel): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Tem certeza que deseja excluir "${product.name}"? O produto só poderá ser excluído se não estiver vinculado em nenhuma Ordem de Serviço.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.deleteProduct(product),
    });
  }

  private deleteProduct(product: ProductModel): void {
    this.productService.remove(product.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Produto excluído com sucesso!',
        });
        this.loadProducts();
      },
    });
  }
}
