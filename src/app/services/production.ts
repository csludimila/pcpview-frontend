import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductOrderModel } from '../models/ordem-producao';

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/product';

  constructor() { }

  // GET /product: Lista todos os produtos
  listarTodas(): Observable<ProductOrderModel[]> {
    return this.http.get<ProductOrderModel[]>(this.API);
  }


  cadastrar(produto: { sku: string; nome: string }): Observable<any> {
    const dadosComId = {
      id: produto.sku, 
      sku: produto.sku,
      nome: produto.nome
    };
    return this.http.post(this.API, dadosComId);
  }

  // DELETE /product/{id}: Remove um produto
  deletar(id: string): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }

  // PATCH /product/updateName/{id}: Atualiza apenas o nome
  atualizarNome(id: string, novoNome: string): Observable<any> {
    // Conforme o Swagger, enviamos o ID na URL e o nome no corpo (body)
    return this.http.patch(`${this.API}/updateName/${id}`, { nome: novoNome });
  }

  buscarPorId(id: string): Observable<ProductOrderModel> {
    // Conforme o print: GET /product/{id}
    return this.http.get<ProductOrderModel>(`${this.API}/${id}`);
  }
}