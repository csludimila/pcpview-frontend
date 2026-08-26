import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { MachineService, MachineDTO } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { ExecutionResponseDTO, OrderResponseDTO, SubOrderResponseDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';
import { AuthService } from '../../services/auth.service';

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
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  maquinas: MachineDTO[] = [];
  ordens: OrderResponseDTO[] = [];
  itensFila: QueueItem[] = [];
  execucoesAbertas: ExecutionResponseDTO[] = [];
  selecaoFilaPorMaquina: Record<string, string> = {};
  isCarregando = false;
  mensagemFeedback = '';
  novaMaquinaNome = '';
  itemArrastado?: QueueItem;
  maquinaExclusaoPendente = '';
  maquinaEdicaoId = '';
  nomeMaquinaEditado = '';

  ngOnInit() {
    this.carregarMaquinas();
    this.carregarOrdens();
    this.carregarExecucoes();
    interval(8000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sincronizarPainel());
  }

  sincronizarPainel() {
    if (this.itemArrastado) return;

    this.carregarMaquinas(true);
    this.carregarOrdens();
    this.carregarExecucoes();
  }

  carregarMaquinas(silencioso = false) {
    if (!silencioso) {
      this.isCarregando = true;
    }

    this.machineService.buscarTodasMaquinas().subscribe({
      next: (dados) => {
        this.maquinas = dados;
        if (this.maquinaExclusaoPendente && !dados.some((maquina) => maquina.id === this.maquinaExclusaoPendente)) {
          this.maquinaExclusaoPendente = '';
        }
        if (this.maquinaEdicaoId && !dados.some((maquina) => maquina.id === this.maquinaEdicaoId)) {
          this.cancelarEdicaoMaquina();
        }
        if (!silencioso) {
          this.isCarregando = false;
        }
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar máquinas.');
        if (!silencioso) {
          this.isCarregando = false;
        }
      }
    });
  }

  carregarOrdens() {
    this.executionOrderService.listarOrdens().subscribe({
      next: (ordens) => {
        this.ordens = ordens;
        this.itensFila = ordens.flatMap((ordem) =>
          (ordem.subOrdens || [])
            .filter((subOrdem) =>
              (subOrdem.quantidadeProduzida || 0) < (subOrdem.quantidadeTotal || 0) &&
              (subOrdem.status === 'AGUARDANDO' || !subOrdem.status)
            )
            .map((subOrdem) => ({
              ...subOrdem,
              ordemNumero: ordem.numeroOrdem || ''
            }))
        );
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar filas de produção.');
      }
    });
  }

  carregarExecucoes() {
    this.executionOrderService.listarTodas().subscribe({
      next: (execucoes) => {
        this.execucoesAbertas = execucoes.filter((execucao) =>
          execucao.status === 'RODANDO' || execucao.status === 'PAUSADA_POR_QUEBRA'
        );
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar execuções ativas.');
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  filaDaMaquina(machineId: string): QueueItem[] {
    return this.itensFila
      .filter((item) => item.maquinaIdealId === machineId)
      .sort((a, b) => (a.posicaoFila || 0) - (b.posicaoFila || 0));
  }

  textoQuantidadeOF(total: number): string {
    return total === 1 ? '1 OF' : `${total} OFs`;
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

  execucaoAtivaDaMaquina(maq: MachineDTO): ExecutionResponseDTO | undefined {
    return this.execucoesAbertas.find((execucao) => execucao.maquinaId === maq.id);
  }

  textoOFAtiva(maq: MachineDTO): string {
    return this.execucaoAtivaDaMaquina(maq)?.subOrdemId || '-';
  }

  textoOperadorAtivo(maq: MachineDTO): string {
    return this.execucaoAtivaDaMaquina(maq)?.operadorNome || '-';
  }

  subOrdemAtivaDaMaquina(maq: MachineDTO): SubOrderResponseDTO | undefined {
    const codigoEtapa = this.execucaoAtivaDaMaquina(maq)?.subOrdemId;
    if (!codigoEtapa) return undefined;

    return this.ordens
      .flatMap((ordem) => ordem.subOrdens || [])
      .find((subOrdem) => subOrdem.codigoEtapa === codigoEtapa);
  }

  textoQuantidadeAtiva(maq: MachineDTO): string {
    const execucao = this.execucaoAtivaDaMaquina(maq);
    if (execucao?.quantidadeTotal !== undefined && execucao.quantidadeProduzida !== undefined) {
      return `${execucao.quantidadeProduzida} / ${execucao.quantidadeTotal} feitas`;
    }

    const subOrdem = this.subOrdemAtivaDaMaquina(maq);
    if (!subOrdem) return '-';

    const feitas = subOrdem.quantidadeProduzida || 0;
    const total = subOrdem.quantidadeTotal || 0;
    return `${feitas} / ${total} feitas`;
  }

  textoRestanteAtivo(maq: MachineDTO): string {
    const execucao = this.execucaoAtivaDaMaquina(maq);
    if (execucao?.quantidadeRestante !== undefined) {
      return `Restam ${execucao.quantidadeRestante}`;
    }

    const subOrdem = this.subOrdemAtivaDaMaquina(maq);
    if (!subOrdem) return 'Restante não carregado';

    const feitas = subOrdem.quantidadeProduzida || 0;
    const total = subOrdem.quantidadeTotal || 0;
    const restante = Math.max(total - feitas, 0);
    return `Restam ${restante}`;
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
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao adicionar ordem à fila.');
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
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao remover ordem da fila.');
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
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao reordenar fila.');
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
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao adicionar máquina.');
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
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao excluir máquina.');
        this.maquinaExclusaoPendente = '';
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
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao alternar o status da máquina.');
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
    const nome = this.nomeMaquinaEditado.trim().toUpperCase();

    if (!id || !nome) {
      this.mensagemFeedback = 'Informe um nome válido para a máquina.';
      return;
    }

    if (nome === (maquina.nome || '').trim().toUpperCase()) {
      this.cancelarEdicaoMaquina();
      return;
    }

    this.isCarregando = true;
    this.machineService.alterarNome(id, { nome }).subscribe({
      next: () => {
        this.mensagemFeedback = 'Nome da máquina atualizado com sucesso.';
        this.cancelarEdicaoMaquina();
        this.carregarMaquinas();
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao atualizar nome da máquina.');
        this.isCarregando = false;
      }
    });
  }
}
