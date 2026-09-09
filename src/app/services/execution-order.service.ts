import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ExecutionStartRequestDTO, 
  ExecutionFinishRequestDTO, 
  ExecutionResponseDTO,
  OrderRequestDTO,
  OrderResponseDTO,
  SubOrderResponseDTO
} from '../models/api.models';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;
export type StatusProducao = 'AGUARDANDO' | 'EM_PROCESSAMENTO' | 'FINALIZADO' | 'CANCELADO';
export type StatusExecucao = 'RODANDO' | 'FINALIZADA' | 'PAUSADA_POR_QUEBRA';

@Injectable({
  providedIn: 'root'
})
export class ExecutionOrderService {

  constructor(private http: HttpClient) { }

  // --- ORDENS ---
  criarOrdemComEtapas(data: OrderRequestDTO): Observable<OrderResponseDTO> {
    return this.http.post<OrderResponseDTO>(`${API_URL}/ordens`, data);
  }

  listarOrdens(status?: StatusProducao): Observable<OrderResponseDTO[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<OrderResponseDTO[]>(`${API_URL}/ordens`, { params });
  }

  excluirOrdem(numeroOrdem: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/ordens/${numeroOrdem}`);
  }

  alterarStatusOrdem(numeroOrdem: string, status: StatusProducao): Observable<OrderResponseDTO> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<OrderResponseDTO>(`${API_URL}/ordens/status/${numeroOrdem}`, null, { params });
  }

  alterarQuantidadeOrdem(numeroOrdem: string, quantidade: number): Observable<OrderResponseDTO> {
    const params = new HttpParams().set('quantidade', quantidade);
    return this.http.patch<OrderResponseDTO>(`${API_URL}/ordens/quantidade/${numeroOrdem}`, null, { params });
  }

  alterarPrioridadeOrdem(numeroOrdem: string, prioridade: number): Observable<OrderResponseDTO> {
    const params = new HttpParams().set('prioridade', prioridade);
    return this.http.patch<OrderResponseDTO>(`${API_URL}/ordens/prioridade/${numeroOrdem}`, null, { params });
  }

  criarSubOrdem(numeroOrdem: string, letra: string): Observable<SubOrderResponseDTO> {
    const params = new HttpParams().set('letra', letra);
    return this.http.post<SubOrderResponseDTO>(
      `${API_URL}/sub-ordens/ordem/${numeroOrdem}`,
      null,
      { params }
    );
  }

  listarSubOrdens(numeroOrdem: string): Observable<SubOrderResponseDTO[]> {
    return this.http.get<SubOrderResponseDTO[]>(`${API_URL}/sub-ordens/ordem/${numeroOrdem}`);
  }

  alterarStatusSubOrdem(codigoEtapa: string, status: StatusProducao): Observable<SubOrderResponseDTO> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<SubOrderResponseDTO>(
      `${API_URL}/sub-ordens/status/${codigoEtapa}`,
      null,
      { params }
    );
  }

  excluirSubOrdem(codigoEtapa: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/sub-ordens/${codigoEtapa}`);
  }

  // --- EXECUÇÕES ---
  listarTodas(filtros: { status?: StatusExecucao; maquinaId?: string; ordemId?: string } = {}): Observable<ExecutionResponseDTO[]> {
    let params = new HttpParams();
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.maquinaId) params = params.set('maquinaId', filtros.maquinaId);
    if (filtros.ordemId) params = params.set('ordemId', filtros.ordemId);

    return this.http.get<ExecutionResponseDTO[]>(`${API_URL}/execucoes`, { params });
  }

  iniciar(data: ExecutionStartRequestDTO): Observable<ExecutionResponseDTO> {
    return this.http.post<ExecutionResponseDTO>(`${API_URL}/execucoes/iniciar`, data);
  }

  finalizar(data: ExecutionFinishRequestDTO): Observable<ExecutionResponseDTO> {
    const params = new HttpParams().set('quantidadeProduzida', data.quantidadeProduzida);
    return this.http.patch<ExecutionResponseDTO>(`${API_URL}/execucoes/finalizar/${data.idExecucao}`, null, { params });
  }

  cancelar(idExecucao: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/execucoes/${idExecucao}`);
  }
}
