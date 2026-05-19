import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MachineModel } from '../models/machine.model';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private readonly API_MACHINE = 'http://localhost:8080/machine';

  constructor(private http: HttpClient) { }

  // Função auxiliar para pegar o token salvo no login e gerar o cabeçalho
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // GET /machine - Busca todas as máquinas do H2
  listAll(): Observable<MachineModel[]> {
    return this.http.get<MachineModel[]>(this.API_MACHINE, { headers: this.getHeaders() });
  }

  // POST /machine - Cadastra nova máquina passando apenas a string do nome
  save(nome: string): Observable<MachineModel> {
    const body = { nome: nome };
    return this.http.post<MachineModel>(this.API_MACHINE, body, { headers: this.getHeaders() });
  }

  // DELETE /machine/{id} - Deleta do H2
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_MACHINE}/${id}`, { headers: this.getHeaders() });
  }

  // PATCH /machine/toggleOperationalStatus/{id} - Altera o status operacional (Manutenção)
  toggleStatus(id: string): Observable<MachineModel> {
    return this.http.patch<MachineModel>(`${this.API_MACHINE}/toggleOperationalStatus/${id}`, {}, { headers: this.getHeaders() });
  }

  // PATCH /machine/updateName/{id} - Altera o nome da máquina
  updateName(id: string, novoNome: string): Observable<MachineModel> {
    return this.http.patch<MachineModel>(`${this.API_MACHINE}/updateName/${id}?name=${novoNome}`, {}, { headers: this.getHeaders() });
  }
}