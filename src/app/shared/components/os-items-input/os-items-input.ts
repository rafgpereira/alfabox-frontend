import { Component, Input, OnDestroy, OnInit, forwardRef, inject } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { SHARED_CRUD_IMPORTS } from '../../constants/shared-crud-imports';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

/** Valor emitido para o formulário pai por item */
export interface OsItemValue {
  productId: string | null;
  quantity: number | null;
  amount: number | null;
  details: string | null;
}

/** Validador de grupo: details obrigatório quando não há productId */
function itemGroupValidator(group: AbstractControl): ValidationErrors | null {
  const productId = group.get('productId')?.value;
  const details = group.get('details')?.value;
  if (!productId && (!details || !String(details).trim())) {
    return { detailsRequired: true };
  }
  return null;
}

@Component({
  selector: 'app-os-items-input',
  standalone: true,
  imports: [...SHARED_CRUD_IMPORTS, InputNumberModule],
  templateUrl: './os-items-input.html',
  styleUrl: './os-items-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OsItemsInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OsItemsInputComponent),
      multi: true,
    },
  ],
})
export class OsItemsInputComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);

  @Input() min = 1;
  @Input() scrollHeight = '300px';

  formArray!: FormArray<FormGroup>;

  /** Catálogo completo de produtos ativos — carregado uma vez no init, filtrado localmente. */
  private allProducts: Product[] = [];

  /** Sugestões de produto por índice de linha (subconjunto filtrado de allProducts) */
  productSuggestions: Map<number, Product[]> = new Map();

  /** Produto selecionado (objeto) por índice — separado do formControl (que guarda o id) */
  selectedProducts: Map<number, Product | null> = new Map();

  private onChange: (value: OsItemValue[]) => void = () => {};
  private onTouched: () => void = () => {};
  private sub!: Subscription;
  private productsSub!: Subscription;

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.formArray = this.fb.array<FormGroup>([]);

    for (let i = 0; i < this.min; i++) {
      this.pushGroup();
    }

    this.sub = this.formArray.valueChanges.subscribe(() => this.emitValue());

    // Carrega todos os produtos ativos uma única vez — filtro feito localmente
    this.productsSub = this.productService.findAll(true).subscribe((products) => {
      this.allProducts = products;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.productsSub?.unsubscribe();
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────

  writeValue(value: OsItemValue[] | null): void {
    if (!this.formArray) return;

    this.formArray.clear({ emitEvent: false });
    this.selectedProducts.clear();

    if (value && value.length > 0) {
      value.forEach((item, i) => {
        this.pushGroup(item, false);
        if (item.productId) {
          // Resolve o objeto produto do catálogo local (sem request extra)
          const found = this.allProducts.find((p) => p.id === item.productId) ?? null;
          if (found) {
            this.selectedProducts.set(i, found);
          } else {
            // Fallback: produto pode não ter carregado ainda (corrida de inicialização)
            this.productService.findById(item.productId).subscribe((product) => {
              this.selectedProducts.set(i, product);
            });
          }
        }
      });
    }

    while (this.formArray.length < this.min) {
      this.pushGroup(null, false);
    }
  }

  registerOnChange(fn: (value: OsItemValue[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ── Validator ─────────────────────────────────────────────────────────

  validate(): ValidationErrors | null {
    if (this.formArray?.invalid) {
      return { osItemsInvalid: true };
    }
    return null;
  }

  // ── Ações ─────────────────────────────────────────────────────────────

  addItem(): void {
    this.pushGroup();
    this.onTouched();
  }

  removeItem(index: number): void {
    if (this.formArray.length <= this.min) return;
    this.formArray.removeAt(index);
    this.selectedProducts.delete(index);
    // Re-indexa o mapa
    const rebuilt = new Map<number, Product | null>();
    this.selectedProducts.forEach((v, k) => {
      if (k > index) rebuilt.set(k - 1, v);
      else if (k < index) rebuilt.set(k, v);
    });
    this.selectedProducts = rebuilt;
    this.onTouched();
  }

  canRemove(): boolean {
    return this.formArray.length > this.min;
  }

  // ── Produto Autocomplete ──────────────────────────────────────────────

  searchProducts(event: AutoCompleteCompleteEvent, index: number): void {
    const query = event.query?.trim().toLowerCase() ?? '';
    const filtered = query
      ? this.allProducts.filter((p) => p.name.toLowerCase().includes(query))
      : [...this.allProducts];
    this.productSuggestions.set(index, filtered);
  }

  onProductSelect(product: Product, index: number): void {
    this.selectedProducts.set(index, product);
    this.formArray.at(index).get('productId')?.setValue(product.id);
    this.onTouched();
  }

  onProductClear(index: number): void {
    this.selectedProducts.set(index, null);
    this.formArray.at(index).get('productId')?.setValue(null);
    this.onTouched();
  }

  getSelectedProduct(index: number): Product | null {
    return this.selectedProducts.get(index) ?? null;
  }

  getProductSuggestions(index: number): Product[] {
    return this.productSuggestions.get(index) ?? [];
  }

  // ── Validação visual ──────────────────────────────────────────────────

  isControlInvalid(groupIndex: number, controlName: string): boolean {
    const ctrl = this.formArray.at(groupIndex)?.get(controlName);
    if (!ctrl) return false;
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  /** Details inválido pela regra cruzada (sem produto + sem details) */
  isDetailsInvalid(groupIndex: number): boolean {
    const group = this.formArray.at(groupIndex);
    if (!group) return false;
    const hasGroupError = group.hasError('detailsRequired');
    const detailsCtrl = group.get('details');
    return hasGroupError && !!(detailsCtrl?.touched || detailsCtrl?.dirty);
  }

  isProductInvalid(groupIndex: number): boolean {
    const group = this.formArray.at(groupIndex);
    if (!group) return false;
    const hasGroupError = group.hasError('detailsRequired');
    const productCtrl = group.get('productId');
    return hasGroupError && !!(productCtrl?.touched || productCtrl?.dirty);
  }

  onFieldBlur(): void {
    this.onTouched();
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  getGroup(index: number): FormGroup {
    return this.formArray.at(index) as FormGroup;
  }

  getControl(groupIndex: number, controlName: string): FormControl {
    return this.formArray.at(groupIndex).get(controlName) as FormControl;
  }

  private pushGroup(value?: OsItemValue | null, emitEvent = true): void {
    const group = this.fb.group(
      {
        productId: [value?.productId ?? null],
        quantity: [value?.quantity ?? null],
        amount: [value?.amount ?? null],
        details: [value?.details ?? null],
      },
      { validators: itemGroupValidator },
    );
    this.formArray.push(group, { emitEvent });
  }

  private emitValue(): void {
    const raw: OsItemValue[] = this.formArray.getRawValue().map((item) => ({
      productId: item['productId'] ?? null,
      quantity: item['quantity'] ?? null,
      amount: item['amount'] ?? null,
      details: item['details'] ?? null,
    }));
    this.onChange(raw);
  }
}
