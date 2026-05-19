import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Importe do ambiente

export interface ProductModel {
    id?: string;
    sku: string;
    nome: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);

    // Alterado para ler dinamicamente a URL do ambiente
    private readonly API_PRODUCT = `${environment.apiUrl}/product`;

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    listarTodos(): Observable<ProductModel[]> {
        return this.http.get<ProductModel[]>(this.API_PRODUCT, { headers: this.getHeaders() });
    }

    cadastrar(produto: ProductModel): Observable<ProductModel> {
        return this.http.post<ProductModel>(this.API_PRODUCT, produto, { headers: this.getHeaders() });
    }

    buscarPorId(id: string): Observable<ProductModel> {
        return this.http.get<ProductModel>(`${this.API_PRODUCT}/${id}`, { headers: this.getHeaders() });
    }

    atualizarNome(id: string, novoNome: string): Observable<ProductModel> {
        return this.http.patch<ProductModel>(`${this.API_PRODUCT}/updateName/${id}`, { nome: novoNome }, { headers: this.getHeaders() });
    }

    deletar(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_PRODUCT}/${id}`, { headers: this.getHeaders() });
    }
}