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
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor() { }

  login(credentials: LoginRequestDTO): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.apiUrl}/login`, credentials).pipe(
      switchMap(response => {
        if (!response?.token) {
          return of(response);
        }

        this.setSession(response.token, credentials.email);

        return this.listarUsuarios().pipe(
          tap((usuarios) => this.marcarPerfilAutenticado(credentials.email, usuarios)),
          map(() => response),
          catchError(() => of(response))
        );
      })
    );
  }

  renovarSessao(): Observable<LoginResponseDTO> {
    return of({ token: this.getToken() || '' });
  }

  revogarSessao(): Observable<void> {
    return of(void 0);
  }

  registrar(usuario: RegisterRequestDTO): Observable<void> {
    const payload = {
      userName: usuario.userName,
      email: usuario.email,
      password: usuario.password
    };

    return this.http.post<void>(`${this.apiUrl}`, payload);
  }

  listarUsuarios(): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(this.apiUrl);
  }

  promoverParaAdmin(userId: string): Observable<UserResponseDTO> {
    return this.http.patch<UserResponseDTO>(`${this.apiUrl}/${userId}/promote`, {});
  }

  desativarUsuario(userId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${userId}/desativar`, {});
  }

  private setSession(token: string, email: string, role?: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessTokenExpiresAt');
    
    const perfil = role || this.decodificarRole(token) || 'USER';
    localStorage.setItem('userRole', perfil);
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

    if (this.tokenExpirado(token)) {
      this.logout();
      return false;
    }

    return true;
  }

  deveRenovarToken(): boolean {
    return false;
  }

  private decodificarRole(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || '';
    } catch(e) {}

    return '';
  }

  private marcarPerfilAutenticado(email: string, usuarios: UserResponseDTO[]) {
    const emailNormalizado = email.trim().toLowerCase();
    const usuario = usuarios.find((item) => this.loginUsuario(item).toLowerCase() === emailNormalizado);

    localStorage.setItem('userRole', usuario?.role || 'ADMIN');
    localStorage.setItem('userEmail', usuario ? this.loginUsuario(usuario) : emailNormalizado);
  }

  private loginUsuario(usuario: UserResponseDTO): string {
    return usuario.login || '';
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
