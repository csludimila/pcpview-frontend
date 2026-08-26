import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MachineDTO {
  id: string;
  nome: string;
  operacional?: boolean;
  statusOperacional?: 'DISPONIVEL' | 'TRABALHANDO' | 'MANUTENCAO';
}

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/machine`;

  constructor() { }

  buscarTodasMaquinas(): Observable<MachineDTO[]> {
    return this.http.get<MachineDTO[]>(this.apiUrl);
  }

  registrarMaquina(maquina: MachineDTO): Observable<MachineDTO> {
    return this.http.post<MachineDTO>(this.apiUrl, maquina);
  }

  deletarMaquina(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  alternarStatusOperacional(id: string): Observable<MachineDTO> {
    return this.http.patch<MachineDTO>(`${this.apiUrl}/toggleOperationalStatus/${id}`, {});
  }

  enviarParaManutencao(id: string): Observable<MachineDTO> {
    return this.http.patch<MachineDTO>(`${this.apiUrl}/sendToMaintenance/${id}`, {});
  }

  alterarNome(id: string, payload: { nome: string }): Observable<MachineDTO> {
    return this.http.patch<MachineDTO>(`${this.apiUrl}/updateName/${id}`, payload);
  }
}
