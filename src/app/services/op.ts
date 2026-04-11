import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpService {

  // 1. O endereço da sua API lá no Spring Boot
  // Quando o back-end estiver pronto, você ajusta esse link
  private API_URL = 'http://localhost:8080/product'; 

  // 2. No construtor, "injetamos" o HttpClient (o nosso 'telefone')
  constructor(private http: HttpClient) { }

  // 3. Função que envia os dados para o Java
  criarOrdem(dadosDaOrdem: any): Observable<any> {
    return this.http.post(this.API_URL, dadosDaOrdem);
  }
}