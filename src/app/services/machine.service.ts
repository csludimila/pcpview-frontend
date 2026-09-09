import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MachineDTO {
  id: string;
  nome: string;
  operacional?: boolean;
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

  buscarMaquinaPorId(id: string): Observable<MachineDTO> {
    return this.http.get<MachineDTO>(`${this.apiUrl}/${id}`);
  }

  registrarMaquina(maquina: MachineDTO): Observable<MachineDTO> {
    return this.http.post<MachineDTO>(this.apiUrl, {
      id: maquina.id,
      nome: maquina.nome
    });
  }

  deletarMaquina(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  alternarStatusOperacional(id: string): Observable<MachineDTO> {
    return this.http.patch<MachineDTO>(`${this.apiUrl}/toggleOperationalStatus/${id}`, {});
  }

  alterarNome(id: string, payload: { nome: string }): Observable<MachineDTO> {
    const params = new HttpParams().set('nome', payload.nome);
    return this.http.patch<MachineDTO>(`${this.apiUrl}/updateName/${id}`, null, { params });
  }
}
