import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

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
      tap(response => {
        if (response && response.token) {
          this.setSession(response.token, credentials.email);
        }
      })
    );
  }

  registrar(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, usuario);
  }

  private setSession(token: string, email: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    
    const role = this.decodificarTokenOuMock(token, email);
    localStorage.setItem('userRole', role);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('userRole');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private decodificarTokenOuMock(token: string, email: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if(payload.role) return payload.role;
    } catch(e) {}
    return email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
  }
}
