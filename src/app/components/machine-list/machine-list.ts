import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachineService, MachineDTO } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { OrderResponseDTO, SubOrderResponseDTO } from '../../models/api.models';

interface QueueItem extends SubOrderResponseDTO {
  ordemNumero: string;
}

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machine-list.html',
  styleUrls: ['./machine-list.css']
})
export class MachineListComponent implements OnInit {
  private machineService = inject(MachineService);
  private executionOrderService = inject(ExecutionOrderService);

  maquinas: MachineDTO[] = [];
  ordens: OrderResponseDTO[] = [];
  itensFila: QueueItem[] = [];
  selecaoFilaPorMaquina: Record<string, string> = {};
  isCarregando = false;
  mensagemFeedback = '';
  novaMaquinaNome = '';
  itemArrastado?: QueueItem;

  ngOnInit() {
    this.carregarMaquinas();
    this.carregarOrdens();
  }

  carregarMaquinas() {
    this.isCarregando = true;
    this.machineService.buscarTodasMaquinas().subscribe({
      next: (dados) => {
        this.maquinas = dados;
        this.isCarregando = false;
      },
      error: (err) => {
        console.error('Erro ao buscar máquinas', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao carregar máquinas.';
        this.isCarregando = false;
      }
    });
  }

  carregarOrdens() {
    this.executionOrderService.listarOrdens().subscribe({
      next: (ordens) => {
        this.ordens = ordens;
        this.itensFila = ordens.flatMap((ordem) =>
          (ordem.subOrdens || [])
            .filter((subOrdem) => (subOrdem.quantidadeProduzida || 0) < (subOrdem.quantidadeTotal || 0))
            .map((subOrdem) => ({
              ...subOrdem,
              ordemNumero: ordem.numeroOrdem || ''
            }))
        );
      },
      error: (err) => {
        console.error('Erro ao buscar ordens', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao carregar filas de produção.';
      }
    });
  }

  get isAdmin(): boolean {
    return localStorage.getItem('userRole') === 'ADMIN';
  }

  filaDaMaquina(machineId: string): QueueItem[] {
    return this.itensFila
      .filter((item) => item.maquinaIdealId === machineId)
      .sort((a, b) => (a.posicaoFila || 0) - (b.posicaoFila || 0));
  }

  statusMaquina(maq: MachineDTO): 'DISPONIVEL' | 'TRABALHANDO' | 'MANUTENCAO' {
    if (maq.statusOperacional) return maq.statusOperacional;
    return maq.operacional ? 'DISPONIVEL' : 'MANUTENCAO';
  }

  textoStatusMaquina(maq: MachineDTO): string {
    const status = this.statusMaquina(maq);
    if (status === 'TRABALHANDO') return 'TRABALHANDO';
    if (status === 'MANUTENCAO') return 'MANUTENÇÃO';
    return 'DISPONÍVEL';
  }

  classeStatusMaquina(maq: MachineDTO): string {
    const status = this.statusMaquina(maq);
    if (status === 'TRABALHANDO') return 'dot-blue';
    if (status === 'MANUTENCAO') return 'dot-red';
    return 'dot-green';
  }

  get itensSemMaquina(): QueueItem[] {
    return this.itensFila.filter((item) => !item.maquinaIdealId);
  }

  adicionarNaFila(machineId: string) {
    const codigoEtapa = this.selecaoFilaPorMaquina[machineId];
    if (!codigoEtapa) {
      this.mensagemFeedback = 'Selecione uma ordem para adicionar na fila.';
      return;
    }

    this.isCarregando = true;
    this.executionOrderService.alterarMaquinaIdeal(codigoEtapa, machineId).subscribe({
      next: () => {
        this.selecaoFilaPorMaquina[machineId] = '';
        this.mensagemFeedback = 'Ordem adicionada à fila da máquina.';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        console.error('Erro ao adicionar ordem à fila', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao adicionar ordem à fila.';
        this.isCarregando = false;
      }
    });
  }

  removerDaFila(codigoEtapa?: string) {
    if (!codigoEtapa) return;

    this.isCarregando = true;
    this.executionOrderService.removerDaFila(codigoEtapa).subscribe({
      next: () => {
        this.mensagemFeedback = 'Ordem removida da fila.';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        console.error('Erro ao remover ordem da fila', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao remover ordem da fila.';
        this.isCarregando = false;
      }
    });
  }

  iniciarArraste(item: QueueItem) {
    if (!this.isAdmin) return;
    this.itemArrastado = item;
  }

  permitirSoltar(event: DragEvent) {
    if (!this.itemArrastado) return;
    event.preventDefault();
  }

  soltarNaFila(machineId: string, itemDestino: QueueItem) {
    if (!this.itemArrastado?.codigoEtapa || !itemDestino.codigoEtapa || this.itemArrastado.codigoEtapa === itemDestino.codigoEtapa) {
      this.itemArrastado = undefined;
      return;
    }

    const filaAtual = this.filaDaMaquina(machineId);
    const origemIndex = filaAtual.findIndex((item) => item.codigoEtapa === this.itemArrastado?.codigoEtapa);
    const destinoIndex = filaAtual.findIndex((item) => item.codigoEtapa === itemDestino.codigoEtapa);

    if (origemIndex < 0 || destinoIndex < 0) {
      this.itemArrastado = undefined;
      return;
    }

    const novaFila = [...filaAtual];
    const [movido] = novaFila.splice(origemIndex, 1);
    novaFila.splice(destinoIndex, 0, movido);

    this.salvarOrdemFila(machineId, novaFila);
  }

  finalizarArraste() {
    this.itemArrastado = undefined;
  }

  private salvarOrdemFila(machineId: string, fila: QueueItem[]) {
    const codigosEtapa = fila.map((item) => item.codigoEtapa).filter((codigo): codigo is string => !!codigo);
    if (codigosEtapa.length === 0) return;

    this.isCarregando = true;
    this.executionOrderService.reordenarFila(machineId, codigosEtapa).subscribe({
      next: () => {
        this.mensagemFeedback = 'Fila reordenada com sucesso.';
        this.itemArrastado = undefined;
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        console.error('Erro ao reordenar fila', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao reordenar fila.';
        this.itemArrastado = undefined;
        this.isCarregando = false;
      }
    });
  }

  adicionarMaquina() {
    if (!this.novaMaquinaNome.trim()) return;

    this.isCarregando = true;
    const novaMaq: MachineDTO = {
      id: 'MAQ-' + Math.floor(Math.random() * 10000), 
      nome: this.novaMaquinaNome.toUpperCase()
    };

    this.machineService.registrarMaquina(novaMaq).subscribe({
      next: () => {
        this.novaMaquinaNome = '';
        this.carregarMaquinas();
      },
      error: (err) => {
        console.error('Erro ao adicionar máquina', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao adicionar máquina.';
        this.isCarregando = false;
      }
    });
  }

  excluirMaquina(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta máquina permanentemente?')) return;
    
    this.isCarregando = true;
    this.machineService.deletarMaquina(id).subscribe({
      next: () => this.carregarMaquinas(),
      error: (err) => {
        console.error('Erro ao excluir', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao excluir máquina.';
        this.isCarregando = false;
      }
    });
  }

  alternarStatus(id: string) {
    this.isCarregando = true;
    this.machineService.alternarStatusOperacional(id).subscribe({
      next: () => {
        this.carregarMaquinas();
        this.carregarOrdens();
      },
      error: (err) => {
        console.error('Erro ao alternar status', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao alternar o status da máquina.';
        this.isCarregando = false;
      }
    });
  }
}
