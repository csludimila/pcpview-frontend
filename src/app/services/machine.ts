import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MachineModel } from '../models/machine.model';
import { environment } from '../../environments/environment'; // Importe do ambiente

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private http = inject(HttpClient);

  // Alterado para ler dinamicamente a URL do ambiente
  private readonly API = `${environment.apiUrl}/machines`; // Ajuste para o nome exato da sua rota de máquinas no Java se necessário

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  listAll(): Observable<MachineModel[]> {
    return this.http.get<MachineModel[]>(this.API, { headers: this.getHeaders() });
  }

  save(nome: string): Observable<MachineModel> {
    return this.http.post<MachineModel>(this.API, { nome }, { headers: this.getHeaders() });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`, { headers: this.getHeaders() });
  }

  toggleStatus(id: string): Observable<MachineModel> {
    return this.http.patch<MachineModel>(`${this.API}/toggleStatus/${id}`, {}, { headers: this.getHeaders() });
  }

  updateName(id: string, novoNome: string): Observable<MachineModel> {
    return this.http.patch<MachineModel>(`${this.API}/updateName/${id}`, { nome: novoNome }, { headers: this.getHeaders() });
  }
}