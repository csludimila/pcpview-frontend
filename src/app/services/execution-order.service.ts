import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ExecutionStartRequestDTO, 
  ExecutionFinishRequestDTO, 
  ExecutionResponseDTO,
  OrderRequestDTO,
  OrderResponseDTO
} from '../models/api.models';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class ExecutionOrderService {

  constructor(private http: HttpClient) { }

  // --- ORDENS ---
  criarOrdemComEtapas(data: OrderRequestDTO): Observable<OrderResponseDTO> {
    return this.http.post<OrderResponseDTO>(`${API_URL}/ordens`, data);
  }

  listarOrdens(): Observable<OrderResponseDTO[]> {
    return this.http.get<OrderResponseDTO[]>(`${API_URL}/ordens`);
  }

  excluirOrdem(numeroOrdem: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/ordens/${numeroOrdem}`);
  }

  // --- EXECUÇÕES ---
  listarTodas(): Observable<ExecutionResponseDTO[]> {
    return this.http.get<ExecutionResponseDTO[]>(`${API_URL}/execucoes`);
  }

  iniciar(data: ExecutionStartRequestDTO): Observable<ExecutionResponseDTO> {
    return this.http.post<ExecutionResponseDTO>(`${API_URL}/execucoes/iniciar`, data);
  }

  finalizar(data: ExecutionFinishRequestDTO): Observable<ExecutionResponseDTO> {
    return this.http.put<ExecutionResponseDTO>(`${API_URL}/execucoes/finalizar`, data);
  }

  pausar(idExecucao: string): Observable<ExecutionResponseDTO> {
    return this.http.patch<ExecutionResponseDTO>(`${API_URL}/execucoes/${idExecucao}/pausar`, {});
  }

  retomar(idExecucao: string): Observable<ExecutionResponseDTO> {
    return this.http.patch<ExecutionResponseDTO>(`${API_URL}/execucoes/${idExecucao}/retomar`, {});
  }

  finalizarSetup(idExecucao: string): Observable<ExecutionResponseDTO> {
    return this.http.patch<ExecutionResponseDTO>(`${API_URL}/execucoes/${idExecucao}/finalizar-setup`, {});
  }

  alterarMaquinaIdeal(codigoEtapa: string, maquinaIdealId: string): Observable<OrderResponseDTO> {
    return this.http.patch<OrderResponseDTO>(`${API_URL}/ordens/subordens/${codigoEtapa}/fila`, { maquinaIdealId });
  }

  removerDaFila(codigoEtapa: string): Observable<OrderResponseDTO> {
    return this.http.delete<OrderResponseDTO>(`${API_URL}/ordens/subordens/${codigoEtapa}/fila`);
  }

  reordenarFila(maquinaIdealId: string, codigosEtapa: string[]): Observable<void> {
    return this.http.patch<void>(`${API_URL}/ordens/subordens/fila/reordenar`, { maquinaIdealId, codigosEtapa });
  }
}
