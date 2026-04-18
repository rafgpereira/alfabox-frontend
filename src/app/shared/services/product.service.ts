import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateProduct, Product, UpdateProduct } from '../models/product.model';

/**
 * Service responsável pela comunicação com o endpoint /products do backend.
 *
 * - providedIn: 'root' → Singleton: uma única instância compartilhada
 *   em toda a aplicação, sem necessidade de declarar em providers.
 * - Todos os métodos retornam Observable (padrão Angular/RxJS).
 *   O componente que consumir decide quando se inscrever e cancelar.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  /**
   * Cria um novo produto.
   * POST /api/products
   */
  create(product: CreateProduct): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  /**
   * Lista todos os produtos.
   * GET /api/products
   * @param isActive — filtro opcional por status ativo/inativo
   */
  findAll(isActive?: boolean): Observable<Product[]> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('active', String(isActive));
    }
    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  /**
   * Busca um produto pelo ID.
   * GET /api/products/:id
   */
  findById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  /**
   * Atualiza parcialmente um produto.
   * PATCH /api/products/:id
   */
  update(id: string, product: UpdateProduct): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}`, product);
  }

  /**
   * Remove um produto.
   * DELETE /api/products/:id
   * O backend retorna 204 No Content, então tipamos como void.
   */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
