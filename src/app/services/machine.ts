import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MachineModel } from '../models/machine.model';

@Injectable({
  providedIn: 'root'
})

// ... imports

export class MachineService {
  private readonly API = 'http://localhost:8080/machine';

  constructor(private http: HttpClient) { }

  listAll(): Observable<MachineModel[]> {
    return this.http.get<MachineModel[]>(this.API).pipe(
      map(machines => machines.map(m => ({
        ...m,
        
        status: m.operacional ? 'DISPONIVEL' : 'MANUTENÇÃO'
      })))
    );
  }

  
  save(nomeDaMaquina: string): Observable<MachineModel> {
    return this.http.post<MachineModel>(this.API, {
      nome: nomeDaMaquina
      
    });
  }

updateName(id: string, newName: string): Observable < MachineModel > { // Mude de <any> para <MachineModel>
  return this.http.patch<MachineModel>(`${this.API}/updateName/${id}`, { nome: newName });
}


toggleStatus(id: string): Observable < MachineModel > {

  return this.http.patch<MachineModel>(`${this.API}/toggleOperationalStatus/${id}`, {});
}

getById(id: string): Observable < MachineModel > {
  return this.http.get<MachineModel>(`${this.API}/${id}`);
}

delete (id: string): Observable < any > {
  return this.http.delete(`${this.API}/${id}`);
}
}