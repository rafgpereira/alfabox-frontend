import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CreateSeller, Seller, UpdateSeller } from '../models/seller.model';

@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sellers`;

  create(seller: CreateSeller): Observable<Seller> {
    return this.http.post<Seller>(this.baseUrl, seller);
  }

  findAll(isActive?: boolean): Observable<Seller[]> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('active', String(isActive));
    }
    return this.http.get<Seller[]>(this.baseUrl, { params });
  }

  findById(id: string): Observable<Seller> {
    return this.http.get<Seller>(`${this.baseUrl}/${id}`);
  }

  update(id: string, seller: UpdateSeller): Observable<Seller> {
    return this.http.patch<Seller>(`${this.baseUrl}/${id}`, seller);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
