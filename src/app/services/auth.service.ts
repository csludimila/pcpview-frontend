import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) { }

  login(credenciais: any): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API}/login`, credenciais);
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  cadastrar(usuario: UserModel): Observable<any> {

    return this.http.post(`${this.API}`, usuario);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }
}
