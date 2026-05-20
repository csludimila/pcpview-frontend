import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

    // CONFIGURAÇÃO REVERTIDA: Voltando a URL fixa local direcionada para sua máquina
    private readonly API_PRODUCT = 'http://localhost:8080/product';

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

    // MANTIDO COM SEGURANÇA: Busca o produto por ID passando os headers locais obrigatórios
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