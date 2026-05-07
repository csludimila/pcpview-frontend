import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductOrderModel } from '../models/ordem-producao';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class ProductionService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/product';


  listarTodas(): Observable<ProductOrderModel[]> {
    return this.http.get<ProductOrderModel[]>(this.API).pipe(
      // 2. Tipamos o 'dados' como ProductOrderModel[] para o TS parar de reclamar
      map((dados: ProductOrderModel[]) => {
        console.log('Dados brutos do Back-end:', dados);
        return dados;
      })
    );
  }


cadastrar(produto: { sku: string; nome: string }): Observable < any > {

  const dadosParaEnviar = {
    sku: produto.sku,
    nome: produto.nome
  };
  return this.http.post(this.API, dadosParaEnviar);
}


deletar(id: string): Observable < any > {
  return this.http.delete(`${this.API}/${id}`);
}


atualizarNome(id: string, novoNome: string): Observable < any > {
  return this.http.patch(`${this.API}/updateName/${id}`, { nome: novoNome });
}

buscarPorId(id: string): Observable < ProductOrderModel > {
  return this.http.get<ProductOrderModel>(`${this.API}/${id}`);
}
}