import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MachineModel } from '../models/machine.model';

@Injectable({
  providedIn: 'root'
})
export class MachineService {
  private readonly API = 'http://localhost:8080/machine'; // Ajuste para a URL real do seu back-end

  constructor(private http: HttpClient) {}

  // GET /machine
  listAll(): Observable<MachineModel[]> {
    return this.http.get<MachineModel[]>(this.API);
  }

  // POST /machine
  save(machine: MachineModel): Observable<MachineModel> {
    return this.http.post<MachineModel>(this.API, machine);
  }

  // PATCH /machine/updateName/{id}
  updateName(id: number, newName: string): Observable<any> {
    return this.http.patch(`${this.API}/updateName/${id}`, { nome: newName });
  }

  // PATCH /machine/toggleOperationalStatus/{id}
  toggleStatus(id: number): Observable<any> {
    return this.http.patch(`${this.API}/toggleOperationalStatus/${id}`, {});
  }

  // GET /machine/{id}
  getById(id: number): Observable<MachineModel> {
    return this.http.get<MachineModel>(`${this.API}/${id}`);
  }

  // DELETE /machine/{id}
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }
}