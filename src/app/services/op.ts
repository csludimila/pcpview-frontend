import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpService {
  
  private readonly API_ORDENS = 'http://localhost:8080/ordens';
  private readonly API_EXECUCOES = 'http://localhost:8080/execucoes';

  constructor(private http: HttpClient) { }

  // Cadastra uma nova OP (POST /ordens)
  cadastrar(ordem: any): Observable<any> {
    return this.http.post<any>(this.API_ORDENS, ordem);
  }

  // Dá o "Play" na máquina (POST /execucoes/iniciar)
  iniciarExecucao(dadosExecucao: any): Observable<any> {
    return this.http.post<any>(`${this.API_EXECUCOES}/iniciar`, dadosExecucao);
  }

  // CORREÇÃO: Método com o nome exato esperado pelo op-form (GET /execucoes)
  buscarExecucoes(): Observable<any[]> {
    return this.http.get<any[]>(this.API_EXECUCOES);
  }

  // Finaliza a produção de um lote (PUT /execucoes/finalizar)
  finalizarExecucao(idExecucao: string, qtdProduzida: number): Observable<any> {
    const body = {
      idExecucao: idExecucao,
      quantidadeProduzida: qtdProduzida
    };
    return this.http.put<any>(`${this.API_EXECUCOES}/finalizar`, body);
  }
}