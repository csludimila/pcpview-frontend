import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../../services/production';
import { ProductOrderModel } from '../../models/ordem-producao';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css'
})
export class OrderFormComponent implements OnInit {
  novaOF = {
    ofPrincipal: '',
    quantidade: 0,
    produto: ''
  };

  listaDeProdutos: ProductOrderModel[] = [];

  constructor(private productionService: ProductionService) { }

  ngOnInit() {
    this.listarProdutos();
  }

  listarProdutos() {
    this.productionService.listarTodas().subscribe({
      next: (dados) => {
        this.listaDeProdutos = dados;
      },
      error: (err) => console.error('Erro ao buscar produtos:', err)
    });
  }

  gerarProducao() {
    if (this.novaOF.ofPrincipal && this.novaOF.produto) {
      const dadosParaEnviar = {
        sku: this.novaOF.ofPrincipal,
        nome: this.novaOF.produto
      };

      this.productionService.cadastrar(dadosParaEnviar).subscribe({
        next: (res) => {
          alert('Sucesso! Ordem enviada para o banco H2.');
          this.listarProdutos();
          this.limparFormulario();
        },
        error: (err) => alert('Erro ao cadastrar. Verifique o Back-end.')
      });
    }
  }

  limparFormulario() {
    this.novaOF = { ofPrincipal: '', quantidade: 0, produto: '' };
  }

  deletarProduto(id: string | undefined) {
    if (id && confirm('Deseja realmente excluir este produto?')) {
      this.productionService.deletar(id).subscribe({
        next: () => {
          alert('Produto removido!');
          this.listarProdutos();
        },
        error: (err) => {
          // Se o Java retornar 404 (Produto não existe), tratamos aqui
          if (err.status === 404) {
            alert('Erro: Este produto não foi encontrado no servidor.');
          } else {
            alert('Erro ao tentar deletar o produto.');
          }
          console.error(err);
        }
      });
    }
  }

    editarProduto(id: string | undefined) {
      if (!id) return;

      const novoNome = prompt('Digite o novo nome para este produto:');

      if (novoNome) {
        this.productionService.atualizarNome(id, novoNome).subscribe({
          next: () => {
            alert('Produto atualizado com sucesso!');
            this.listarProdutos();
          },
          error: (err) => alert('Erro ao atualizar. Verifique se o produto existe.')
        });
      }
    }

    // NOVO MÉTODO ADICIONADO AQUI
    visualizarProduto(id: string | undefined) {
      if (id) {
        this.productionService.buscarPorId(id).subscribe({
          next: (produto) => {
            alert(`Produto encontrado:\nID: ${produto.id}\nSKU: ${produto.sku}\nNome: ${produto.nome}`);
          },
          error: (err) => {
            if (err.status === 404) {
              alert('Produto não encontrado no banco de dados.');
            } else {
              alert('Erro ao buscar detalhes do produto.');
            }
          }
        });
      }
    }
  }