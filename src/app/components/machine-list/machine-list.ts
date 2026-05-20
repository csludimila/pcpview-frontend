import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachineService } from '../../services/machine';
import { ProductionService } from '../../services/production';
import { MachineModel, MachineStatus } from '../../models/machine.model';
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
  novaMaquinaNome: string = ''; // Declarado apenas uma vez agora
  maquinaParaIniciar?: MachineModel;

  constructor(
    private machineService: MachineService,
    private productionService: ProductionService
  ) { }

  ngOnInit(): void {
    this.carregarMaquinas();
    this.carregarOrdens();

    // Atualização automática a cada 30 segundos
    setInterval(() => {
      this.carregarOrdens();
    }, 30000);
  }

  // --- GERENCIAMENTO DE MÁQUINAS (API) ---

  carregarMaquinas() {
    this.machineService.listAll().subscribe(dados => {
      this.machines = dados;
    });
  }

  registrarMaquina(nome: string) {
    if (!nome || nome.trim() === '') {
      alert('Por favor, digite um nome para a máquina.');
      return;
    }

    // No seu serviço, a função 'save' espera apenas a string do nome
    this.machineService.save(nome).subscribe({
      next: () => {
        this.novaMaquinaNome = ''; // Limpa o campo de texto
        this.carregarMaquinas();    // Recarrega a lista
        alert('Máquina cadastrada com sucesso!');
      },
      error: (err: any) => {
        console.error('Erro ao registrar', err);
        alert('Erro ao cadastrar. Verifique se o Backend está rodando.');
      }
    });
  }

  deletar(id: string | undefined) {
    if (id && confirm("Deseja realmente excluir esta máquina?")) {
      this.machineService.delete(id).subscribe({
        next: () => {
          this.machines = this.machines.filter(m => m.id !== id);
          alert("Máquina deletada!");
        },
        error: (err) => alert("Erro ao tentar deletar.")
      });
    }
  }

  // --- LÓGICA DE STATUS E OPERAÇÃO ---

  pausar(maquina: MachineModel) {
    maquina.status = 'PAUSADO';
  }

  manutencao(maquina: MachineModel) {
    if (maquina.id && confirm(`Colocar a ${maquina.nome} em MANUTENÇÃO?`)) {
      this.machineService.toggleStatus(maquina.id).subscribe(() => {
        this.carregarMaquinas();
      });
    }
  }

  alterarStatusManual(maquina: MachineModel, novoStatus: MachineStatus) {
    maquina.status = novoStatus;
  }

  // --- LÓGICA DE PRODUÇÃO (ORDENS) ---

  // CORREÇÃO 1: Removemos a trava do localStorage para buscar SEMPRE do banco H2
  carregarOrdens() {
    this.productionService.listarTodas().subscribe({
      next: (dados) => {
        this.orders = dados;
        console.log('Ordens carregadas com sucesso no frontend:', dados);
      },
      error: (err) => { console.error('Erro ao carregar ordens do H2', err); }
    });
  }

  abrirSelecaoOF(maquina: MachineModel) {
    this.maquinaParaIniciar = maquina;
  }

  vincularOrdem(numeroOrdem: string) {
    if (!this.maquinaParaIniciar) {
      alert('Por favor, selecione uma máquina no painel primeiro!');
      return;
    }

    if (!numeroOrdem || numeroOrdem.trim() === '') {
      alert('Por favor, selecione um Lote válido!');
      return;
    }

    const ordemCompleta = this.orders.find(o => o.numeroOrdem === numeroOrdem);

    if (ordemCompleta && this.maquinaParaIniciar.id) {
      this.maquinaParaIniciar.status = 'TRABALHANDO';
      this.maquinaParaIniciar.ofAtiva = ordemCompleta.numeroOrdem;

      // 1. Atualiza o status localmente para refletir na tela imediatamente
      ordemCompleta.status = OrderStatus.FABRICANDO;

      // 2. INTEGRAÇÃO SWAGGER: Sincroniza a mudança de status com o Banco H2
      this.productionService.atualizarNome(ordemCompleta.numeroOrdem, 'FABRICANDO').subscribe({
        next: () => {
          console.log(`Ordem ${ordemCompleta.numeroOrdem} atualizada para FABRICANDO no banco.`);
        },
        error: (err) => {
          console.error('Erro ao sincronizar status da ordem com o backend:', err);
        }
      });

      alert(`Sucesso! A máquina ${this.maquinaParaIniciar.nome} iniciou a OP ${ordemCompleta.numeroOrdem}`);
    } else {
      alert('Ordem de serviço não encontrada ou inválida no sistema.');
    }
  }

  abrirApontamento(maquina: MachineModel) {
    const qtdProd = prompt(`Quantas peças foram produzidas na ${maquina.nome}?`);

    // Valida se o operador digitou um valor e se é um número válido
    if (qtdProd && !isNaN(Number(qtdProd))) {
      const ordem = this.orders.find(o => o.numeroOrdem === maquina.ofAtiva);

      if (ordem) {
        // 1. Atualiza os dados localmente
        ordem.quantidadeProduzida = Number(qtdProd);
        ordem.status = OrderStatus.FINALIZADA;

        // 2. INTEGRAÇÃO SWAGGER: Envia o comando de encerramento para o Banco H2
        this.productionService.atualizarNome(ordem.numeroOrdem, 'FINALIZADA').subscribe({
          next: () => {
            console.log(`Ordem ${ordem.numeroOrdem} encerrada com sucesso no banco.`);
            alert(`Produção apontada com sucesso! ${qtdProd} peças usinadas.`);
            this.carregarOrdens(); // Recarrega a lista para atualizar os contadores na tela
          },
          error: (err) => {
            console.error('Erro ao salvar o apontamento no backend:', err);
            alert('Erro ao salvar o apontamento no banco de dados.');
          }
        });
      }

      // 3. Libera a máquina para a próxima operação
      maquina.status = 'DISPONIVEL';
      maquina.ofAtiva = '';
    } else if (qtdProd !== null) {
      alert('Por favor, insira um valor numérico válido para a quantidade.');
    }
  }


  // --- UTILITÁRIOS ---

  alterarStatus(id: string) {
    this.machineService.toggleStatus(id).subscribe({
      next: (maquinaAtualizada) => {
        this.atualizarMaquinaNaLista(maquinaAtualizada);
      },
      error: (err) => alert("Erro ao alterar status.")
    });
  }

  alterarNome(maquina: MachineModel) {
    const novoNome = prompt(`Digite o novo nome para a máquina ${maquina.nome}:`);
    if (maquina.id && novoNome && novoNome.trim() !== '') {
      this.machineService.updateName(maquina.id, novoNome).subscribe({
        next: (maquinaAtualizada) => {
          this.atualizarMaquinaNaLista(maquinaAtualizada);
          alert("Nome atualizado!");
        },
        error: (err) => alert("Erro ao atualizar nome.")
      });
    }
  }

  atualizarMaquinaNaLista(maquinaAtualizada: MachineModel) {
    const index = this.machines.findIndex(m => m.id === maquinaAtualizada.id);
    if (index !== -1) {
      // Sincroniza o array local exatamente com o DTO do banco de dados
      this.machines[index] = {
        ...maquinaAtualizada,
        operacional: maquinaAtualizada.operacional
      };
    }
  }
}