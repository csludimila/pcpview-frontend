import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
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
  private authService = inject(AuthService);
  
  private apiUrl = `${environment.apiUrl}/machine`;

  constructor() { }

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  buscarTodasMaquinas(): Observable<MachineDTO[]> {
    return this.http.get<MachineDTO[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  registrarMaquina(maquina: MachineDTO): Observable<MachineDTO> {
    return this.http.post<MachineDTO>(this.apiUrl, maquina, { headers: this.getHeaders() });
  }

  deletarMaquina(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  alternarStatusOperacional(id: string): Observable<MachineDTO> {
    return this.http.patch<MachineDTO>(`${this.apiUrl}/toggleOperationalStatus/${id}`, {}, { headers: this.getHeaders() });
  }

  alterarNome(id: string, payload: { nome: string }): Observable<MachineDTO> {
    return this.http.patch<MachineDTO>(`${this.apiUrl}/updateName/${id}`, payload, { headers: this.getHeaders() });
  }
}
