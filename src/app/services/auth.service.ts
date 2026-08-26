import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RegisterRequestDTO, ResetPasswordRequestDTO, UserResponseDTO } from '../models/api.models';

export interface LoginRequestDTO {
  email: string;
  password?: string;
}

export interface LoginResponseDTO {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor() { }

  login(credentials: LoginRequestDTO): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          this.setSession(response.token, credentials.email, response.refreshToken, response.expiresAt);
        }
      })
    );
  }

  renovarSessao(): Observable<LoginResponseDTO> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<LoginResponseDTO>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response && response.token) {
          this.setSession(
            response.token,
            this.getUserEmail() || '',
            response.refreshToken,
            response.expiresAt
          );
        }
      })
    );
  }

  revogarSessao(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken });
  }

  registrar(usuario: RegisterRequestDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}`, usuario);
  }

  listarUsuarios(): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(`${this.apiUrl}/users`);
  }

  redefinirSenha(userId: string, body: ResetPasswordRequestDTO): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/users/${userId}/password`, body);
  }

  private setSession(token: string, email: string, refreshToken?: string, expiresAt?: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (expiresAt) {
      localStorage.setItem('accessTokenExpiresAt', expiresAt);
    }
    
    const role = this.decodificarRole(token) || 'USER';
    localStorage.setItem('userRole', role);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const role = this.decodificarRole(token);
    return role || localStorage.getItem('userRole');
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    if (this.tokenExpirado(token) && !this.getRefreshToken()) {
      this.logout();
      return false;
    }

    return true;
  }

  deveRenovarToken(): boolean {
    const token = this.getToken();
    return !!token && this.tokenExpirado(token) && !!this.getRefreshToken();
  }

  private decodificarRole(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || '';
    } catch(e) {}

    return '';
  }

  private tokenExpirado(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;

      return payload.exp * 1000 <= Date.now();
    } catch(e) {
      return true;
    }
  }
}
