import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MachineService } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { MachineResponseDTO, ExecutionResponseDTO, OrderResponseDTO, SubOrderResponseDTO, ExecutionStartRequestDTO } from '../../models/api.models';

interface SubOrderOption extends SubOrderResponseDTO {
  ordemNumero: string;
}

@Component({
  selector: 'app-op-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './op-form.html',
  styleUrls: ['./op-form.css']
})
export class OpFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  listaDeMaquinas: MachineResponseDTO[] = [];
  listaDeOrdens: SubOrderOption[] = [];
  listaDeExecucoes: ExecutionResponseDTO[] = [];
  execucaoAtual?: ExecutionResponseDTO;
  maquinaSelecionada?: MachineResponseDTO;
  mensagemFeedback: string = '';

  opForm = new FormGroup({
    idMaquina: new FormControl('', Validators.required),
    idEtapaSubOrdem: new FormControl('', Validators.required),
    quantidadeProduzida: new FormControl(1, [Validators.required, Validators.min(1)]),
    setupPrimeiraPeca: new FormControl(false)
  });

  constructor(
    private machineService: MachineService,
    private executionOrderService: ExecutionOrderService
  ) { }

  ngOnInit() {
    this.carregarMaquinas();
    this.carregarOrdensPlanejadas();
    this.carregarExecucoes();

    // Escuta mudanças no formulário via reatividade
    this.opForm.get('idMaquina')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        this.atualizarStatusMaquina(id);
      });

    this.opForm.get('idEtapaSubOrdem')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.atualizarExecucaoAtualPorSelecao());
  }

  verificarStatusMaquina() {
    const idMaquina = this.opForm.get('idMaquina')?.value;
    this.atualizarStatusMaquina(idMaquina);
  }

  private atualizarStatusMaquina(id: string | null | undefined) {
    if (!id) {
      this.maquinaSelecionada = undefined;
      return;
    }

    this.maquinaSelecionada = this.listaDeMaquinas.find(m => m.id === id);
    this.validarSubOrdemSelecionadaParaMaquina(id);

    if (this.maquinaSelecionada?.statusOperacional === 'TRABALHANDO') {
      this.mensagemFeedback = 'Atenção: Esta máquina já está trabalhando.';
    } else if (this.maquinaSelecionada && !this.maquinaSelecionada.operacional) {
      this.mensagemFeedback = 'Atenção: Esta máquina está em manutenção.';
    } else {
      this.mensagemFeedback = '';
    }
  }

  carregarMaquinas() {
    this.machineService.buscarTodasMaquinas().subscribe({
      next: (dados) => this.listaDeMaquinas = dados
    });
  }

  carregarOrdensPlanejadas() {
    this.executionOrderService.listarOrdens().subscribe({
      next: (ordens) => {
        this.listaDeOrdens = ordens.flatMap((ordem: OrderResponseDTO) =>
          (ordem.subOrdens || [])
            .filter((subOrdem) => (subOrdem.quantidadeProduzida || 0) < (subOrdem.quantidadeTotal || 0))
            .map((subOrdem) => ({
              ...subOrdem,
              ordemNumero: ordem.numeroOrdem || ''
            }))
        );
        this.validarSubOrdemSelecionadaParaMaquina(this.opForm.controls.idMaquina.value);
      },
      error: () => this.mensagemFeedback = 'Erro ao carregar ordens planejadas.'
    });
  }

  get ordensDisponiveisParaMaquina(): SubOrderOption[] {
    const maquinaId = this.opForm.controls.idMaquina.value;
    const ordens = !maquinaId
      ? this.listaDeOrdens
      : this.listaDeOrdens.filter((ordem) => !ordem.maquinaIdealId || ordem.maquinaIdealId === maquinaId);

    return [...ordens].sort((a, b) => {
      const aPrioridade = this.prioridadeOrdem(a, maquinaId);
      const bPrioridade = this.prioridadeOrdem(b, maquinaId);

      if (aPrioridade !== bPrioridade) return aPrioridade - bPrioridade;
      if ((a.posicaoFila || 0) !== (b.posicaoFila || 0)) return (a.posicaoFila || 9999) - (b.posicaoFila || 9999);

      return (a.codigoEtapa || '').localeCompare(b.codigoEtapa || '');
    });
  }

  private prioridadeOrdem(ordem: SubOrderOption, maquinaId: string | null | undefined): number {
    if (!maquinaId) {
      if (ordem.maquinaIdealId) return 0;
      return 1;
    }

    if (ordem.maquinaIdealId === maquinaId) return 0;
    if (!ordem.maquinaIdealId) return 1;
    return 2;
  }

  private validarSubOrdemSelecionadaParaMaquina(maquinaId: string | null | undefined) {
    const codigoSelecionado = this.opForm.controls.idEtapaSubOrdem.value;
    if (!codigoSelecionado || !maquinaId) return;

    const selecionada = this.listaDeOrdens.find((ordem) => ordem.codigoEtapa === codigoSelecionado);
    if (selecionada?.maquinaIdealId && selecionada.maquinaIdealId !== maquinaId) {
      this.opForm.controls.idEtapaSubOrdem.setValue('');
      this.execucaoAtual = undefined;
    }
  }

  textoOpcaoOrdem(ordem: SubOrderOption): string {
    const proxima = this.proximaOrdemDaFila?.codigoEtapa === ordem.codigoEtapa ? 'Próxima | ' : '';
    const fila = ordem.maquinaIdealId ? `Fila ${ordem.posicaoFila || '-'}` : 'Sem máquina';
    return `${proxima}${ordem.codigoEtapa} | ${ordem.quantidadeProduzida || 0} / ${ordem.quantidadeTotal} peças | ${fila}`;
  }

  get proximaOrdemDaFila(): SubOrderOption | undefined {
    return this.ordensDisponiveisParaMaquina[0];
  }

  get avisoOrdemForaDaFila(): string {
    const selecionada = this.subOrdemSelecionada;
    const proxima = this.proximaOrdemDaFila;

    if (!selecionada || !proxima || selecionada.codigoEtapa === proxima.codigoEtapa) return '';
    if (!selecionada.maquinaIdealId || selecionada.maquinaIdealId !== proxima.maquinaIdealId) return '';

    return `A próxima OF da fila é ${proxima.codigoEtapa}.`;
  }

  get resumoFilaSelecionada(): string {
    const maquinaId = this.opForm.controls.idMaquina.value;
    if (!maquinaId) return 'Selecione uma máquina para visualizar a fila disponível.';

    const maquina = this.listaDeMaquinas.find((item) => item.id === maquinaId)?.nome || 'máquina selecionada';
    const total = this.ordensDisponiveisParaMaquina.length;
    if (total === 0) return `Nenhuma OF disponível para ${maquina}.`;

    const primeira = this.ordensDisponiveisParaMaquina[0];
    const prefixo = total === 1 ? '1 OF disponível' : `${total} OFs disponíveis`;
    return `${prefixo} para ${maquina}. Próxima: ${primeira.codigoEtapa || '-'}.`;
  }

  carregarExecucoes() {
    this.executionOrderService.listarTodas().subscribe({
      next: (execucoes) => {
        this.listaDeExecucoes = execucoes;
        this.atualizarExecucaoAtualPorSelecao();
      },
      error: () => this.mensagemFeedback = 'Erro ao carregar execuções em andamento.'
    });
  }

  get subOrdemSelecionada(): SubOrderOption | undefined {
    const codigoEtapa = this.opForm.controls.idEtapaSubOrdem.value;
    return this.listaDeOrdens.find((ordem) => ordem.codigoEtapa === codigoEtapa);
  }

  get saldoSelecionado(): string {
    const subOrdem = this.subOrdemSelecionada;
    if (!subOrdem) return '0 / 0 PEÇAS';

    return `${subOrdem.quantidadeProduzida || 0} / ${subOrdem.quantidadeTotal || 0} PEÇAS`;
  }

  get statusExecucaoAtual(): string {
    return this.execucaoAtual?.status || 'AGUARDANDO INÍCIO';
  }

  get textoStatusMaquinaSelecionada(): string {
    if (!this.maquinaSelecionada) return '';
    if (this.maquinaSelecionada.statusOperacional === 'TRABALHANDO') return 'TRABALHANDO';
    if (this.maquinaSelecionada.statusOperacional === 'MANUTENCAO' || !this.maquinaSelecionada.operacional) return 'MANUTENÇÃO';
    return 'DISPONÍVEL';
  }

  get classeStatusMaquinaSelecionada(): string {
    if (this.maquinaSelecionada?.statusOperacional === 'TRABALHANDO') return 'producao';
    if (this.maquinaSelecionada?.statusOperacional === 'MANUTENCAO' || !this.maquinaSelecionada?.operacional) return 'aguardando';
    return 'finalizada';
  }

  get maquinaPodeIniciar(): boolean {
    return this.maquinaSelecionada?.statusOperacional === 'DISPONIVEL' || (!!this.maquinaSelecionada?.operacional && !this.maquinaSelecionada?.statusOperacional);
  }

  private atualizarExecucaoAtualPorSelecao() {
    const codigoEtapa = this.opForm.controls.idEtapaSubOrdem.value;

    if (!codigoEtapa) {
      this.execucaoAtual = undefined;
      return;
    }

    this.execucaoAtual = this.listaDeExecucoes
      .filter((execucao) =>
        execucao.subOrdemId === codigoEtapa &&
        (execucao.status === 'RODANDO' || execucao.status === 'PAUSADA_POR_QUEBRA')
      )
      .sort((a, b) => (b.dataInicio || '').localeCompare(a.dataInicio || ''))[0];
  }

  onIniciar() {
    if (this.opForm.invalid) return;

    const payload: ExecutionStartRequestDTO = {
      idMaquina: this.opForm.controls.idMaquina.value || '',
      idEtapaSubOrdem: this.opForm.controls.idEtapaSubOrdem.value || '',
      setupPrimeiraPeca: this.opForm.controls.setupPrimeiraPeca.value || false
    };
    this.executionOrderService.iniciar(payload).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.listaDeExecucoes = [execucao, ...this.listaDeExecucoes];
        this.mensagemFeedback = 'Produção iniciada com sucesso!';
        this.carregarMaquinas();
        this.carregarOrdensPlanejadas();
      },
      error: (err) => this.mensagemFeedback = err.error?.message || 'Erro ao iniciar produção.'
    });
  }

  onPausar() {
    if (!this.execucaoAtual?.id) {
      this.mensagemFeedback = 'Inicie uma produção antes de pausar.';
      return;
    }

    this.executionOrderService.pausar(this.execucaoAtual.id).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.listaDeExecucoes = this.listaDeExecucoes.map((item) => item.id === execucao.id ? execucao : item);
        this.mensagemFeedback = 'Produção pausada por quebra. O tempo produtivo parou de contar.';
      },
      error: (err) => this.mensagemFeedback = err.error?.message || 'Erro ao pausar produção.'
    });
  }

  onManutencao() {
    this.onPausar();
  }

  onRetomar() {
    if (!this.execucaoAtual?.id) {
      this.mensagemFeedback = 'Não há execução pausada para retomar.';
      return;
    }

    this.executionOrderService.retomar(this.execucaoAtual.id).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.listaDeExecucoes = this.listaDeExecucoes.map((item) => item.id === execucao.id ? execucao : item);
        this.mensagemFeedback = 'Produção retomada. O tempo produtivo voltou a contar.';
      },
      error: (err) => this.mensagemFeedback = err.error?.message || 'Erro ao retomar produção.'
    });
  }

  onFinalizarSetup() {
    if (!this.execucaoAtual?.id) {
      this.mensagemFeedback = 'Inicie uma produção com setup para finalizar o setup.';
      return;
    }

    this.executionOrderService.finalizarSetup(this.execucaoAtual.id).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.listaDeExecucoes = this.listaDeExecucoes.map((item) => item.id === execucao.id ? execucao : item);
        this.mensagemFeedback = 'Setup da primeira peça registrado. O restante do lote será calculado separado.';
      },
      error: (err) => this.mensagemFeedback = err.error?.message || 'Erro ao finalizar setup.'
    });
  }

  onFinalizar() {
    const quantidadeProduzida = this.opForm.controls.quantidadeProduzida.value || 0;

    if (!this.execucaoAtual?.id || quantidadeProduzida <= 0) {
      this.mensagemFeedback = 'Inicie uma produção e informe uma quantidade válida.';
      return;
    }

    this.executionOrderService.finalizar({
      idExecucao: this.execucaoAtual.id,
      quantidadeProduzida
    }).subscribe({
      next: () => {
        this.mensagemFeedback = 'Apontamento finalizado com sucesso!';
        this.listaDeExecucoes = this.listaDeExecucoes.filter((item) => item.id !== this.execucaoAtual?.id);
        this.execucaoAtual = undefined;
        this.opForm.reset({ idMaquina: '', idEtapaSubOrdem: '', quantidadeProduzida: 1, setupPrimeiraPeca: false });
        this.carregarMaquinas();
        this.carregarOrdensPlanejadas();
        this.carregarExecucoes();
      },
      error: (err) => this.mensagemFeedback = err.error?.message || 'Erro ao finalizar apontamento.'
    });
  }

  formatarDuracao(segundos?: number): string {
    if (!segundos) return '0s';

    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const seg = Math.floor(segundos % 60);

    if (horas > 0) return `${horas}h ${minutos}min ${seg}s`;
    if (minutos > 0) return `${minutos}min ${seg}s`;
    return `${seg}s`;
  }
}
