import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MachineModel } from '../models/machine.model';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private http = inject(HttpClient);

  // CONFIGURAÇÃO REVERTIDA: Voltando a URL fixa local direcionada para sua máquina
  private readonly API = 'http://localhost:8080/machines';

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