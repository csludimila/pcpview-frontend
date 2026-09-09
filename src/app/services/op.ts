import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ExecutionResponseDTO,
  ExecutionStartRequestDTO,
  OrderRequestDTO,
  OrderResponseDTO
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class OpService {
  
  private readonly API_ORDENS = `${environment.apiUrl}/ordens`;
  private readonly API_EXECUCOES = `${environment.apiUrl}/execucoes`;

  constructor(private http: HttpClient) { }

  cadastrar(ordem: OrderRequestDTO): Observable<OrderResponseDTO> {
    return this.http.post<OrderResponseDTO>(this.API_ORDENS, ordem);
  }

  iniciarExecucao(dadosExecucao: ExecutionStartRequestDTO): Observable<ExecutionResponseDTO> {
    return this.http.post<ExecutionResponseDTO>(`${this.API_EXECUCOES}/iniciar`, dadosExecucao);
  }

  buscarExecucoes(): Observable<ExecutionResponseDTO[]> {
    return this.http.get<ExecutionResponseDTO[]>(this.API_EXECUCOES);
  }

  finalizarExecucao(idExecucao: string, qtdProduzida: number): Observable<ExecutionResponseDTO> {
    const params = new HttpParams().set('quantidadeProduzida', qtdProduzida);
    return this.http.patch<ExecutionResponseDTO>(`${this.API_EXECUCOES}/finalizar/${idExecucao}`, null, { params });
  }
}
