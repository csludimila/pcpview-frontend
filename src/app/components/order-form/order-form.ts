import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../../services/production';
import { ProductOrderModel } from '../../models/ordem-producao';
import { MachineService } from '../../services/machine'; // Importa o serviço [cite: 442, 463]
import { MachineModel } from '../../models/machine.model'; // Importa o modelo da máquina

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css'
})
export class OrderFormComponent implements OnInit {
  novaOF = {
    sku: '',
    nome: ''
  };

  listaDeProdutos: ProductOrderModel[] = [];

  listaDeMaquinas: MachineModel[] = [];

  constructor(private productionService: ProductionService, private machineService: MachineService) { }

  ngOnInit() {
    this.listarProdutos();
    this.carregarMaquinas();
  }
  
  carregarMaquinas() {
    this.machineService.listAll().subscribe({
      next: (dados: MachineModel[]) => { 
        this.listaDeMaquinas = dados;
      },
      error: (err: any) => console.error('Erro ao buscar máquinas', err) 
    });
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
    if (this.novaOF.sku && this.novaOF.nome) {
      this.productionService.cadastrar(this.novaOF).subscribe({
        next: (res) => {
          // --- LOGICA PARA A APRESENTAÇÃO ---
          // Pegamos o que já existe no "banco" do navegador
          const ordensSalvas = JSON.parse(localStorage.getItem('minhas-ordens') || '[]');

          // Criamos uma nova ordem baseada no que acabamos de cadastrar
          const novaOrdemSimulada = {
            ofGerada: this.novaOF.sku, // Usamos o SKU como número da OF
            nomeProduto: this.novaOF.nome,
            status: 'PLANEJADO',
            saldo: Math.floor(Math.random() * 100) + 10 // Gera um saldo aleatório para ficar bonito
          };

          ordensSalvas.push(novaOrdemSimulada);
          localStorage.setItem('minhas-ordens', JSON.stringify(ordensSalvas));
          // ----------------------------------

          alert('Sucesso! Ordem de Produção gerada e enviada para a Fábrica.');
          this.listarProdutos();
          this.limparFormulario();
        },
        error: (err) => {
          console.error('Erro detalhado:', err);
          alert('Erro ao cadastrar. Verifique se o Backend está rodando na porta 8080.');
        }
      });
    }
  }

  limparFormulario() {
    this.novaOF = { sku: '', nome: '' };
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