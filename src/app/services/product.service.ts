import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductRequestDTO, ProductResponseDTO, UpdateProductNameDTO } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/product`;

  constructor() { }

  buscarTodosProdutos(): Observable<ProductResponseDTO[]> {
    return this.http.get<ProductResponseDTO[]>(this.apiUrl);
  }

  registrarProduto(produto: ProductRequestDTO): Observable<ProductResponseDTO> {
    return this.http.post<ProductResponseDTO>(this.apiUrl, produto);
  }

  atualizarNomeProduto(id: string, data: UpdateProductNameDTO): Observable<ProductResponseDTO> {
    const params = new HttpParams().set('nome', data.nome);
    return this.http.patch<ProductResponseDTO>(`${this.apiUrl}/updateName/${id}`, null, { params });
  }

  deletarProduto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
