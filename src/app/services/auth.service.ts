import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { RegisterRequestDTO, UserResponseDTO } from '../models/api.models';

export type UserModel = RegisterRequestDTO;

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

  constructor(private http: HttpClient) {}

  login(credenciais: LoginRequestDTO): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.API}/login`, credenciais).pipe(
      tap((res) => {
        if (res?.token) {
          this.setSession(res.token, credenciais.email);
        }
      })
    );
  }

  cadastrar(usuario: RegisterRequestDTO): Observable<any> {
    return this.http.post(`${this.API}/register`, usuario);
  }

  registrar(usuario: RegisterRequestDTO): Observable<any> {
    return this.cadastrar(usuario);
  }

  listarUsuarios(): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(`${this.API}/users`);
  }

  promoverParaAdmin(id?: string): Observable<any> {
    return this.http.patch(`${this.API}/users/${id}/role`, { role: 'ADMIN' });
  }

  desativarUsuario(id?: string): Observable<any> {
    return this.http.delete(`${this.API}/users/${id}`);
  }

  revogarSessao(): Observable<any> {
    return of(true).pipe(tap(() => this.logout()));
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('auth_token');
  }

  getUserEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }

  getRole(): string {
    return localStorage.getItem('userRole') || 'USER';
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
  }

  private setSession(token: string, email: string, role?: string) {
    this.setToken(token);
    localStorage.setItem('userEmail', email);

    const perfil = role || this.decodificarRole(token) || 'USER';
    localStorage.setItem('userRole', perfil);
  }

  private decodificarRole(token: string): string | null {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const decodedJson = atob(payloadBase64);
      const payload = JSON.parse(decodedJson);
      return payload.role || payload.perfil || null;
    } catch {
      return null;
    }
  }
}