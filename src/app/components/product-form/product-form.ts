import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

import { ProductService, ProductModel } from '../../services/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.html'
})
export class ProductFormComponent implements OnInit {
  
  listaDeProdutos: ProductModel[] = [];
  
  produtoForm = new FormGroup({
    id: new FormControl('', Validators.required),
    sku: new FormControl('', Validators.required),
    nome: new FormControl('', Validators.required)
  });

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.carregarProdutos();
  }

  carregarProdutos() {
    this.productService.listarTodos().subscribe({
      // 2. CORREÇÃO: Adicionado tipo 'any[]' para o parâmetro não dar erro de 'any' implícito
      next: (dados: any[]) => {
        this.listaDeProdutos = dados;
      },
      // 3. CORREÇÃO: Adicionado tipo 'any' para o erro
      error: (err: any) => console.error('Erro ao listar produtos:', err)
    });
  }

  onSalvar() {
    if (this.produtoForm.valid) {
      const novoProduto = this.produtoForm.value as ProductModel;
      this.productService.cadastrar(novoProduto).subscribe({
        next: () => {
          alert('Produto cadastrado com sucesso no banco H2!');
          this.produtoForm.reset();
          this.carregarProdutos();
        },
        // 4. CORREÇÃO: Adicionado tipo 'any' para o erro
        error: (err: any) => alert('Erro ao salvar produto.')
      });
    }
  }
}