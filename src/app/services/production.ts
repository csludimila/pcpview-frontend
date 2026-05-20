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

  // CONFIGURAÇÃO REVERTIDA: Voltando a URL fixa local para o seu computador
  private readonly API = 'http://localhost:8080/ordens';

  // Função auxiliar para injetar o Token JWT nas requisições
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 1. Procura todas as ordens (GET /ordens)
  listarTodas(): Observable<ProductOrderModel[]> {
    return this.http.get<ProductOrderModel[]>(this.API, { headers: this.getHeaders() }).pipe(
      map((dados: ProductOrderModel[]) => {
        console.log('Dados brutos de Ordens do Back-end:', dados);
        return dados;
      })
    );
  }

  // 2. Cadastra uma nova ordem (POST /ordens)
  cadastrar(ordem: any): Observable<any> {
    return this.http.post(this.API, ordem, { headers: this.getHeaders() });
  }

  // 3. Deleta uma ordem pelo ID (DELETE /ordens/{id})
  deletar(id: string): Observable<any> {
    return this.http.delete(`${this.API}/${id}`, { headers: this.getHeaders() });
  }

  // 4. CONFIGURAÇÃO REVERTIDA: Voltando a enviar a propriedade original { nome }
  atualizarNome(id: string, novoNome: string): Observable<any> {
    return this.http.patch(`${this.API}/updateName/${id}`, { nome: novoNome }, { headers: this.getHeaders() });
  }

  // 5. MANTIDO COM SEGURANÇA: Busca uma ordem específica por ID passando os headers locais
  buscarPorId(id: string): Observable<ProductOrderModel> {
    return this.http.get<ProductOrderModel>(`${this.API}/${id}`, { headers: this.getHeaders() });
  }
}