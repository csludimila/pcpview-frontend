import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductOrderModel } from '../models/ordem-producao';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  private http = inject(HttpClient);
  
  private readonly API = 'http://localhost:8080/ordens'; 

  // Função auxiliar para injetar o Token JWT nas requisições
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 1. Procura todas as ordens (GET /order)
  listarTodas(): Observable<ProductOrderModel[]> {
    return this.http.get<ProductOrderModel[]>(this.API, { headers: this.getHeaders() }).pipe(
      map((dados: ProductOrderModel[]) => {
        console.log('Dados brutos de Ordens do Back-end:', dados);
        return dados;
      })
    );
  }

  // 2. Cadastra uma nova ordem (POST /order)
  cadastrar(ordem: any): Observable<any> {
    return this.http.post(this.API, ordem, { headers: this.getHeaders() });
  }

  // 3. Deleta uma ordem pelo ID (DELETE /order/{id})
  deletar(id: string): Observable<any> {
    return this.http.delete(`${this.API}/${id}`, { headers: this.getHeaders() });
  }

  // 4. Atualiza o status/nome de uma ordem se necessário (PATCH /order/...)
  atualizarNome(id: string, novoNome: string): Observable<any> {
    return this.http.patch(`${this.API}/updateName/${id}`, { nome: novoNome }, { headers: this.getHeaders() });
  }

  // 5. Busca uma ordem específica por ID (GET /order/{id})
  buscarPorId(id: string): Observable<ProductOrderModel> {
    return this.http.get<ProductOrderModel>(`${this.API}/${id}`, { headers: this.getHeaders() });
  }
}