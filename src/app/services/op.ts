import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpService {
  
  private readonly API_ORDENS = `${environment.apiUrl}/ordens`;
  private readonly API_EXECUCOES = `${environment.apiUrl}/execucoes`;

  constructor(private http: HttpClient) { }

  cadastrar(ordem: any): Observable<any> {
    return this.http.post<any>(this.API_ORDENS, ordem);
  }

  iniciarExecucao(dadosExecucao: any): Observable<any> {
    return this.http.post<any>(`${this.API_EXECUCOES}/iniciar`, dadosExecucao);
  }

  buscarExecucoes(): Observable<any[]> {
    return this.http.get<any[]>(this.API_EXECUCOES);
  }

  finalizarExecucao(idExecucao: string, qtdProduzida: number): Observable<any> {
    const body = {
      idExecucao: idExecucao,
      quantidadeProduzida: qtdProduzida
    };
    return this.http.put<any>(`${this.API_EXECUCOES}/finalizar`, body);
  }
}
