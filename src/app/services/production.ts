import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductOrderModel } from '../models/ordem-producao'; // Verifique se o nome do arquivo está correto

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  private http = inject(HttpClient);
  
  // URL do seu Back-end (ajuste se a porta for diferente)
  private readonly API = 'http://localhost:8080/api/ordens'; 

  constructor() { }

  // REGRA 1: Planejamento (Admin cadastra e o back gera sub-OFs)
  // O back-end recebe a OF Principal e a Qtd, e retorna a lista de sub-OFs criadas
  gerarOrdens(dados: { ofPrincipal: string, quantidade: number }): Observable<ProductOrderModel[]> {
    return this.http.post<ProductOrderModel[]>(`${this.API}/gerar`, dados);
  }

  // REGRA 2 & 3: Listar o que está acontecendo
  listarTodas(): Observable<ProductOrderModel[]> {
    return this.http.get<ProductOrderModel[]>(this.API);
  }

  // REGRA 3: Apontamento Parcial (Baixa de lote)
  // O operador envia o ID da ordem e quantas peças fez
  apontarProducao(id: number, qtdFeita: number): Observable<ProductOrderModel> {
    return this.http.patch<ProductOrderModel>(`${this.API}/${id}/apontar`, { qtdFeita });
  }
}