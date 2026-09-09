import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ProductRequestDTO, ProductResponseDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './product-form.html'
})
export class ProductFormComponent implements OnInit {
  private productService = inject(ProductService);

  // Variáveis exigidas pelo HTML
  produtos: ProductResponseDTO[] = [];
  isCarregando = false;
  mensagemFeedback = '';
  termoBusca = '';
  produtoEmEdicaoId = '';
  produtoExclusaoPendenteId = '';
  nomeEditado = '';
  
  novoProduto: ProductRequestDTO = {
    id: '',
    sku: '',
    nome: ''
  };

  ngOnInit() {
    this.carregarProdutos();
  }

  carregarProdutos() {
    this.isCarregando = true;
    this.productService.buscarTodosProdutos().subscribe({
      next: (dados: ProductResponseDTO[]) => {
        this.produtos = dados;
        if (this.produtoExclusaoPendenteId && !dados.some((produto) => produto.id === this.produtoExclusaoPendenteId)) {
          this.produtoExclusaoPendenteId = '';
        }
        this.isCarregando = false;
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar produtos do servidor.');
        this.isCarregando = false;
      }
    });
  }

  get produtosFiltrados(): ProductResponseDTO[] {
    const termo = this.termoBusca.trim().toLowerCase();
    if (!termo) return this.produtos;

    return this.produtos.filter((produto) =>
      produto.id?.toLowerCase().includes(termo) ||
      produto.sku?.toLowerCase().includes(termo) ||
      produto.nome?.toLowerCase().includes(termo)
    );
  }

  adicionarProduto() {
    if (!this.novoProduto.id || !this.novoProduto.sku || !this.novoProduto.nome) {
      this.mensagemFeedback = 'Preencha todos os campos do produto.';
      return;
    }

    this.isCarregando = true;
    this.productService.registrarProduto(this.novoProduto).subscribe({
      next: () => {
        this.novoProduto = { id: '', sku: '', nome: '' };
        this.mensagemFeedback = 'Produto cadastrado com sucesso.';
        this.carregarProdutos();
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao cadastrar produto.');
        this.isCarregando = false;
      }
    });
  }

  iniciarEdicao(produto: ProductResponseDTO) {
    this.produtoEmEdicaoId = produto.id || '';
    this.produtoExclusaoPendenteId = '';
    this.nomeEditado = produto.nome || '';
    this.mensagemFeedback = '';
  }

  cancelarEdicao() {
    this.produtoEmEdicaoId = '';
    this.nomeEditado = '';
  }

  salvarEdicao(produto: ProductResponseDTO) {
    if (!produto.id || !this.nomeEditado.trim()) {
      this.mensagemFeedback = 'Informe um nome válido para atualizar o produto.';
      return;
    }

    this.isCarregando = true;
    this.productService.atualizarNomeProduto(produto.id, { nome: this.nomeEditado.trim() }).subscribe({
      next: () => {
        this.mensagemFeedback = 'Produto atualizado com sucesso.';
        this.cancelarEdicao();
        this.carregarProdutos();
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao atualizar produto.');
        this.isCarregando = false;
      }
    });
  }

  excluirProduto(id: string | undefined) {
    if (!id) return;

    if (this.produtoExclusaoPendenteId !== id) {
      this.produtoExclusaoPendenteId = id;
      this.mensagemFeedback = 'Clique novamente em excluir para confirmar a remoção do produto.';
      return;
    }
    
    this.isCarregando = true;
    this.mensagemFeedback = '';
    this.productService.deletarProduto(id).subscribe({
      next: () => {
        this.mensagemFeedback = 'Produto excluído com sucesso.';
        this.produtoExclusaoPendenteId = '';
        this.carregarProdutos();
      },
      error: (err: unknown) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao excluir produto.');
        this.produtoExclusaoPendenteId = '';
        this.isCarregando = false;
      }
    });
  }
}
