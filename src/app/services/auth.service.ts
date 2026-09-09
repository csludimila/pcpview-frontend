import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RegisterRequestDTO, UserResponseDTO } from '../models/api.models';

export interface LoginRequestDTO {
  email: string;
  password?: string;
}

export interface LoginResponseDTO {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) { }

  login(credenciais: any): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API}/login`, credenciais);
  }

  private setSession(token: string, email: string, role?: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
    
    const perfil = role || this.decodificarRole(token) || 'USER';
    localStorage.setItem('userRole', perfil);
  }

  cadastrar(usuario: UserModel): Observable<any> {

    return this.http.post(`${this.API}`, usuario);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }
}