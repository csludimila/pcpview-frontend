import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { MachineService, MachineDTO } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { ExecutionResponseDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machine-list.html',
  styleUrls: ['./machine-list.css']
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

  adicionarMaquina() {
    const id = this.normalizarTextoMaiusculo(this.novaMaquinaId);
    const nome = this.normalizarTextoMaiusculo(this.novaMaquinaNome);
    if (!id || !nome) {
      this.mensagemFeedback = 'Informe ID e nome para cadastrar a máquina.';
      return;
    }

    this.isCarregando = true;
    this.machineService.registrarMaquina({ id, nome }).subscribe({
      next: () => {
        this.novaMaquinaId = '';
        this.novaMaquinaNome = '';
        this.mensagemFeedback = 'Máquina cadastrada com sucesso.';
        this.carregarMaquinas();
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao cadastrar máquina.');
        this.isCarregando = false;
      }
    });
  }

  excluirMaquina(id: string) {
    if (this.maquinaExclusaoPendente !== id) {
      this.maquinaExclusaoPendente = id;
      this.cancelarEdicaoMaquina();
      this.mensagemFeedback = 'Clique novamente em excluir para confirmar a remoção da máquina.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';
    this.machineService.deletarMaquina(id).subscribe({
      next: () => {
        this.maquinaExclusaoPendente = '';
        this.mensagemFeedback = 'Máquina excluída com sucesso.';
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
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao alternar status da máquina.');
        this.isCarregando = false;
      }
    });
  }

  iniciarEdicaoMaquina(maquina: MachineDTO) {
    if (!maquina.id) return;

    this.maquinaEdicaoId = maquina.id;
    this.nomeMaquinaEditado = maquina.nome || '';
    this.maquinaExclusaoPendente = '';
    this.mensagemFeedback = '';
  }

  cancelarEdicaoMaquina() {
    this.maquinaEdicaoId = '';
    this.nomeMaquinaEditado = '';
  }

  salvarNomeMaquina(maquina: MachineDTO) {
    const id = maquina.id;
    const nome = this.normalizarTextoMaiusculo(this.nomeMaquinaEditado);

    if (!id || !nome) {
      this.mensagemFeedback = 'Informe um nome válido para a máquina.';
      return;
    }

    if (nome === this.normalizarTextoMaiusculo(maquina.nome || '')) {
      this.cancelarEdicaoMaquina();
      return;
    }

    // CORREÇÃO: Busca por o.numeroOrdem em vez de o.id
    const ordemCompleta = this.orders.find(o => o.numeroOrdem === numeroOrdem);

    if (ordemCompleta && this.maquinaParaIniciar.id) {
      this.maquinaParaIniciar.status = 'TRABALHANDO';
      this.maquinaParaIniciar.ofAtiva = ordemCompleta.numeroOrdem;

      alert(`Sucesso! A máquina ${this.maquinaParaIniciar.nome} iniciou a OP ${ordemCompleta.numeroOrdem}`);
    } else {
      alert('Ordem de serviço não encontrada ou inválida no sistema.');
    }
  }

  abrirApontamento(maquina: MachineModel) {
    const qtdProd = prompt(`Quantas peças foram produzidas na ${maquina.nome}?`);
    if (qtdProd) {
      // CORREÇÃO: Mudamos o 'o.id' para 'o.numeroOrdem'
      const ordem = this.orders.find(o => o.numeroOrdem === maquina.ofAtiva);

      if (ordem) {
        ordem.status = OrderStatus.FINALIZADA;
      }
      maquina.status = 'DISPONIVEL';
      maquina.ofAtiva = '';
      alert('Produção apontada com sucesso!');
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