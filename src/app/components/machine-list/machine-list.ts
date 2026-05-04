import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachineService } from '../../services/machine';
import { ProductionService } from '../../services/production';
import { MachineModel, MachineStatus } from '../../models/machine.model'; // Importamos o tipo de Status
import { ProductOrderModel, OrderStatus } from '../../models/ordem-producao';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machine-list.html',
  styleUrl: './machine-list.css'
})
export class MachineListComponent implements OnInit {
  machines: MachineModel[] = [];
  orders: ProductOrderModel[] = [];
  novaMaquinaNome: string = '';
  maquinaParaIniciar?: MachineModel;

  constructor(
    private machineService: MachineService,
    private productionService: ProductionService
  ) { }

  ngOnInit(): void {
    this.carregarMaquinas();
    this.carregarOrdens();

    // Atualização automática da fila de produção
    setInterval(() => {
      this.carregarOrdens();
    }, 30000);
  }

  carregarMaquinas() {
    this.machineService.listAll().subscribe(dados => {
      this.machines = dados;
    });
  }

  carregarOrdens() {
    // 1. Primeiro, tentamos buscar o que você salvou no LocalStorage (Parte A)
    const dadosLocalStorage = localStorage.getItem('minhas-ordens');

    if (dadosLocalStorage) {
      // Se existir algo no navegador, carregamos isso na tela
      this.orders = JSON.parse(dadosLocalStorage);
      console.log('Ordens carregadas do LocalStorage');
    } else {
      // 2. Se não houver nada no LocalStorage, usamos o serviço original
      this.productionService.listarTodas().subscribe({
        next: (dados) => {
          this.orders = dados;
        },
        error: (err) => {
          console.error('Erro ao carregar ordens do serviço, e LocalStorage vazio.', err);
        }
      });
    }
  }


  pausar(maquina: MachineModel) {
    maquina.status = 'PAUSADO';
    // Aqui você enviaria para o back-end se necessário:
    // this.machineService.updateStatus(maquina.id, 'PAUSADO').subscribe();
  }

  manutencao(maquina: MachineModel) {
    if (maquina.id && confirm(`Colocar a ${maquina.nome} em MANUTENÇÃO?`)) {
      // Chamamos o back-end. Se estava true, vira false (manutenção)
      this.machineService.toggleStatus(maquina.id).subscribe(() => {
        this.carregarMaquinas();
      });
    }
  }

  // Função genérica caso queira mudar o status via código
  alterarStatusManual(maquina: MachineModel, novoStatus: MachineStatus) {
    maquina.status = novoStatus;
  }

  // --- LÓGICA DE PRODUÇÃO ---

  abrirSelecaoOF(maquina: MachineModel) {
    this.maquinaParaIniciar = maquina;
  }

  vincularOrdem(ordem: ProductOrderModel) {
    if (this.maquinaParaIniciar && this.maquinaParaIniciar.id) {
      this.maquinaParaIniciar.status = 'TRABALHANDO';
      this.maquinaParaIniciar.ofAtiva = ordem.ofGerada;

      ordem.status = OrderStatus.FABRICANDO;
      localStorage.setItem('minhas-ordens', JSON.stringify(this.orders));

      alert(`Sucesso! A máquina ${this.maquinaParaIniciar.nome} iniciou a OF ${ordem.ofGerada}`);
    }
  }


  abrirApontamento(maquina: MachineModel) {
    const qtdProd = prompt(`Quantas peças foram produzidas na ${maquina.nome}?`);

    if (qtdProd) {
      // 1. Voltamos a máquina para Disponível
      maquina.status = 'DISPONIVEL';
      maquina.ofAtiva = '';


      const ordem = this.orders.find(o => o.ofGerada === maquina.ofAtiva);
      if (ordem) {
        ordem.status = OrderStatus.FINALIZADA;
      }


      localStorage.setItem('minhas-ordens', JSON.stringify(this.orders));

      alert('Produção apontada com sucesso!');
    }
  }
  // --- GERENCIAMENTO (SWAGGER/API) ---

  alterarStatus(id: string) {
    this.machineService.toggleStatus(id).subscribe({
      next: (maquinaAtualizada) => {
        // EM VEZ DE: this.carregarMaquinas();
        this.atualizarMaquinaNaLista(maquinaAtualizada);
        console.log(`Máquina atualizada com sucesso!`);
      },
      error: (err) => alert("Erro ao alterar status.")
    });
  }

  alterarNome(maquina: MachineModel) {
    const novoNome = prompt(`Digite o novo nome para a máquina ${maquina.nome}:`);

    if (maquina.id && novoNome && novoNome.trim() !== '') {
      this.machineService.updateName(maquina.id, novoNome).subscribe({
        next: (maquinaAtualizada) => {
          // EM VEZ DE: this.carregarMaquinas();
          this.atualizarMaquinaNaLista(maquinaAtualizada);
          alert("Nome atualizado!");
        },
        error: (err) => alert("Erro ao atualizar nome.")
      });
    }
  }
  atualizarMaquinaNaLista(maquinaAtualizada: MachineModel) {
    // Encontra a posição (índice) da máquina no seu array atual
    const index = this.machines.findIndex(m => m.id === maquinaAtualizada.id);

    if (index !== -1) {
      this.machines[index] = {
        ...maquinaAtualizada,
        status: maquinaAtualizada.operacional ? 'DISPONIVEL' : 'MANUTENÇÃO'
      };
    }
  }

  deletar(id: string | undefined) {
    if (id && confirm("Deseja realmente excluir esta máquina?")) {
      this.machineService.delete(id).subscribe({
        next: () => {
          // Filtra a lista atual para remover a máquina que acabamos de deletar
          this.machines = this.machines.filter(m => m.id !== id);
          alert("Máquina deletada com sucesso!");
        },
        error: (err) => {
          if (err.status === 404) {
            alert("A máquina não existe no banco de dados.");
          } else {
            alert("Erro ao tentar deletar a máquina.");
          }
        }
      });
    }
  }
}