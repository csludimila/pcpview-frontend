import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';


// Interface base para tipar as respostas do Backend (conforme DTO do Swagger)

export interface ProductModel {

    id?: string;

    sku: string;

    nome: string;

}


@Injectable({

    providedIn: 'root'

})

export class ProductService {


    private readonly API_PRODUCT = 'http://localhost:8080/product';


    constructor(private http: HttpClient) { }


    // 1. Procura todos os produtos (GET /product)

    listarTodos(): Observable<ProductModel[]> {

        return this.http.get<ProductModel[]>(this.API_PRODUCT);

    }


    // 2. Cadastra um novo produto (POST /product)

    cadastrar(produto: ProductModel): Observable<ProductModel> {

        return this.http.post<ProductModel>(this.API_PRODUCT, produto);

    }


    // 3. Procura um produto pelo seu ID (GET /product/{id})

    buscarPorId(id: string): Observable<ProductModel> {

        return this.http.get<ProductModel>(`${this.API_PRODUCT}/${id}`);

    }


    // 4. Atualiza o nome de um produto (PATCH /product/updateName/{id})

    atualizarNome(id: string, novoNome: string): Observable<ProductModel> {

        return this.http.patch<ProductModel>(`${this.API_PRODUCT}/updateName/${id}`, { nome: novoNome });

    }


    // 5. Deleta um produto pelo seu ID (DELETE /product/{id})



    deletar(id: string): Observable<void> {

        return this.http.delete<void>(`${this.API_PRODUCT}/${id}`);

    }

} 