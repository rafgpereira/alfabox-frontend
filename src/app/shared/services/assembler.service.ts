import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Assembler, CreateAssembler, UpdateAssembler } from '../models/assembler.model';

@Injectable({ providedIn: 'root' })
export class AssemblerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/assemblers`;

  /**
   * Cria um novo montador.
   * POST /api/assemblers
   */
  create(assembler: CreateAssembler): Observable<Assembler> {
    return this.http.post<Assembler>(this.baseUrl, assembler);
  }

  /**
   * Lista todos os montadores.
   * GET /api/assemblers
   * @param isActive — filtro opcional por status ativo/inativo
   */
  findAll(isActive?: boolean): Observable<Assembler[]> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('active', String(isActive));
    }
    return this.http.get<Assembler[]>(this.baseUrl, { params });
  }

  /**
   * Busca um montador pelo ID.
   * GET /api/assemblers/:id
   */
  findById(id: string): Observable<Assembler> {
    return this.http.get<Assembler>(`${this.baseUrl}/${id}`);
  }

  /**
   * Atualiza parcialmente um montador.
   * PATCH /api/assemblers/:id
   */
  update(id: string, assembler: UpdateAssembler): Observable<Assembler> {
    return this.http.patch<Assembler>(`${this.baseUrl}/${id}`, assembler);
  }

  /**
   * Remove um montador.
   * DELETE /api/assemblers/:id
   * O backend retorna 204 No Content, então tipamos como void.
   */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
