import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { interval } from 'rxjs';
import { MachineService } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { MachineResponseDTO, ExecutionResponseDTO, OrderResponseDTO, SubOrderResponseDTO, ExecutionStartRequestDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';

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
  mensagemFeedback = '';

  opForm = new FormGroup({
    idMaquina: new FormControl('', Validators.required),
    idEtapaSubOrdem: new FormControl('', Validators.required),
    idExecucao: new FormControl(''),
    quantidadeProduzida: new FormControl(1, [Validators.required, Validators.min(0)])
  });

  constructor(
    private machineService: MachineService,
    private executionOrderService: ExecutionOrderService
  ) { }

  ngOnInit() {
    this.carregarMaquinas();
    this.carregarOrdensPlanejadas();
    this.carregarExecucoes();

    this.opForm.get('idMaquina')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => this.atualizarMaquinaSelecionada(id));

    this.opForm.get('idEtapaSubOrdem')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.atualizarExecucaoAtualPorSelecao());

    this.opForm.get('idExecucao')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => this.selecionarExecucaoPorId(id));

    interval(8000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sincronizarOperacao());
  }

  sincronizarOperacao() {
    this.carregarMaquinas();
    this.carregarOrdensPlanejadas();
    this.carregarExecucoes();
  }

  carregarMaquinas() {
    this.machineService.buscarTodasMaquinas().subscribe({
      next: (dados) => {
        this.listaDeMaquinas = dados.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        this.atualizarMaquinaSelecionada(this.opForm.controls.idMaquina.value);
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar máquinas.')
    });
  }

  carregarOrdensPlanejadas() {
    this.executionOrderService.listarOrdens().subscribe({
      next: (ordens) => {
        this.listaDeOrdens = ordens.flatMap((ordem: OrderResponseDTO) =>
          (ordem.subOrdens || [])
            .filter((subOrdem) => this.temSaldo(subOrdem))
            .map((subOrdem) => ({
              ...subOrdem,
              ordemNumero: ordem.numeroOrdem || ''
            }))
        ).sort((a, b) => (a.codigoEtapa || '').localeCompare(b.codigoEtapa || ''));
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar etapas planejadas.')
    });
  }

  carregarExecucoes() {
    this.executionOrderService.listarTodas().subscribe({
      next: (execucoes) => {
        this.listaDeExecucoes = execucoes;
        this.atualizarExecucaoAtualPorSelecao();
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar execuções.')
    });
  }

  get maquinasDisponiveisOperacao(): MachineResponseDTO[] {
    return this.listaDeMaquinas.filter((maquina) => maquina.operacional !== false);
  }

  get execucoesRodando(): ExecutionResponseDTO[] {
    return this.listaDeExecucoes.filter((execucao) => execucao.status === 'RODANDO');
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

  get loteSelecionado(): string {
    return this.subOrdemSelecionada?.codigoEtapa || this.execucaoAtual?.subOrdemId || '-';
  }

  get maquinaSelecionadaTexto(): string {
    return this.maquinaSelecionada?.nome || this.execucaoAtual?.maquinaNome || '-';
  }

  get statusExecucaoAtual(): string {
    return this.execucaoAtual?.status || 'AGUARDANDO INÍCIO';
  }

  get textoStatusMaquinaSelecionada(): string {
    if (!this.maquinaSelecionada) return '';
    return this.maquinaSelecionada.operacional === false ? 'INDISPONÍVEL' : 'OPERACIONAL';
  }

  get classeStatusMaquinaSelecionada(): string {
    if (!this.maquinaSelecionada) return 'aguardando';
    return this.maquinaSelecionada.operacional === false ? 'aguardando' : 'finalizada';
  }

  get maquinaPodeIniciar(): boolean {
    return !!this.maquinaSelecionada && this.maquinaSelecionada.operacional !== false;
  }

  get execucaoRodando(): boolean {
    return this.execucaoAtual?.status === 'RODANDO';
  }

  get podeIniciar(): boolean {
    return !!this.opForm.controls.idMaquina.value &&
      !!this.opForm.controls.idEtapaSubOrdem.value &&
      this.maquinaPodeIniciar &&
      !this.execucaoAbertaDaSubOrdem(this.opForm.controls.idEtapaSubOrdem.value);
  }

  get podeFinalizar(): boolean {
    const quantidadeProduzida = this.opForm.controls.quantidadeProduzida.value;
    return !!this.execucaoAtual?.id &&
      this.execucaoRodando &&
      quantidadeProduzida !== null &&
      quantidadeProduzida >= 0;
  }

  get podeCancelar(): boolean {
    return !!this.execucaoAtual?.id && this.execucaoRodando;
  }

  textoOpcaoOrdem(ordem: SubOrderOption): string {
    return `${ordem.codigoEtapa} | ${ordem.quantidadeProduzida || 0} / ${ordem.quantidadeTotal} peças`;
  }

  textoOpcaoExecucao(execucao: ExecutionResponseDTO): string {
    return `${execucao.subOrdemId || '-'} | ${execucao.maquinaNome || '-'} | ${execucao.operadorNome || '-'}`;
  }

  onIniciar() {
    if (!this.podeIniciar) return;

    const payload: ExecutionStartRequestDTO = {
      idMaquina: this.opForm.controls.idMaquina.value || '',
      idEtapaSubOrdem: this.opForm.controls.idEtapaSubOrdem.value || ''
    };

    this.executionOrderService.iniciar(payload).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.opForm.controls.idExecucao.setValue(execucao.id || '', { emitEvent: false });
        this.listaDeExecucoes = [execucao, ...this.listaDeExecucoes];
        this.mensagemFeedback = 'Execução iniciada com sucesso.';
        this.carregarOrdensPlanejadas();
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao iniciar execução.')
    });
  }

  onFinalizar() {
    const quantidadeProduzida = this.opForm.controls.quantidadeProduzida.value;

    if (!this.podeFinalizar || !this.execucaoAtual?.id || quantidadeProduzida === null) {
      this.mensagemFeedback = 'Selecione uma execução rodando e informe a quantidade produzida.';
      return;
    }

    this.executionOrderService.finalizar({
      idExecucao: this.execucaoAtual.id,
      quantidadeProduzida
    }).subscribe({
      next: () => {
        this.mensagemFeedback = 'Apontamento finalizado com sucesso.';
        this.execucaoAtual = undefined;
        this.opForm.reset({ idMaquina: '', idEtapaSubOrdem: '', idExecucao: '', quantidadeProduzida: 1 });
        this.carregarMaquinas();
        this.carregarOrdensPlanejadas();
        this.carregarExecucoes();
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao finalizar apontamento.')
    });
  }

  onCancelar() {
    if (!this.podeCancelar || !this.execucaoAtual?.id) {
      this.mensagemFeedback = 'Selecione uma execução rodando para cancelar.';
      return;
    }

    this.executionOrderService.cancelar(this.execucaoAtual.id).subscribe({
      next: () => {
        this.mensagemFeedback = 'Execução cancelada com sucesso.';
        this.execucaoAtual = undefined;
        this.opForm.patchValue({ idExecucao: '' });
        this.carregarExecucoes();
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao cancelar execução.')
    });
  }

  formatarData(data?: string): string {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  }

  private atualizarMaquinaSelecionada(id: string | null | undefined) {
    this.maquinaSelecionada = this.listaDeMaquinas.find(m => m.id === id);
    this.atualizarExecucaoAtualPorSelecao();
  }

  private selecionarExecucaoPorId(id: string | null | undefined) {
    if (!id) {
      this.atualizarExecucaoAtualPorSelecao();
      return;
    }

    this.execucaoAtual = this.listaDeExecucoes.find((execucao) => execucao.id === id);
    if (this.execucaoAtual?.subOrdemId && this.opForm.controls.idEtapaSubOrdem.value !== this.execucaoAtual.subOrdemId) {
      this.opForm.controls.idEtapaSubOrdem.setValue(this.execucaoAtual.subOrdemId, { emitEvent: false });
    }
  }

  private atualizarExecucaoAtualPorSelecao() {
    const codigoEtapa = this.opForm.controls.idEtapaSubOrdem.value;
    const maquinaId = this.opForm.controls.idMaquina.value;

    const execucaoPorEtapa = codigoEtapa ? this.execucaoAbertaDaSubOrdem(codigoEtapa) : undefined;
    const execucaoPorMaquina = maquinaId ? this.execucaoAbertaDaMaquina(maquinaId) : undefined;
    this.execucaoAtual = execucaoPorEtapa || execucaoPorMaquina || undefined;

    if (this.execucaoAtual?.id && this.opForm.controls.idExecucao.value !== this.execucaoAtual.id) {
      this.opForm.controls.idExecucao.setValue(this.execucaoAtual.id, { emitEvent: false });
    }
  }

  private execucaoAbertaDaSubOrdem(codigoEtapa: string | null | undefined): ExecutionResponseDTO | undefined {
    if (!codigoEtapa) return undefined;
    return this.execucoesRodando.find((execucao) => execucao.subOrdemId === codigoEtapa);
  }

  private execucaoAbertaDaMaquina(maquinaId: string | null | undefined): ExecutionResponseDTO | undefined {
    if (!maquinaId) return undefined;

    const maquina = this.listaDeMaquinas.find((item) => item.id === maquinaId);
    return this.execucoesRodando.find((execucao) =>
      execucao.maquinaId === maquinaId ||
      (!!maquina?.nome && execucao.maquinaNome === maquina.nome)
    );
  }

  private temSaldo(subOrdem: SubOrderResponseDTO): boolean {
    return (subOrdem.quantidadeProduzida || 0) < (subOrdem.quantidadeTotal || 0);
  }
}
