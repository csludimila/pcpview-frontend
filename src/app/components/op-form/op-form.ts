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
  produtoNome?: string;
  produtoSku?: string;
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

  readonly setoresProcesso = ['CORTE', 'CALDEIRARIA', 'USINAGEM', 'ACABAMENTO', 'INSPECAO', 'EXPEDICAO'];

  listaDeMaquinas: MachineResponseDTO[] = [];
  listaDeOrdens: SubOrderOption[] = [];
  listaDeExecucoes: ExecutionResponseDTO[] = [];
  execucaoAtual?: ExecutionResponseDTO;
  maquinaSelecionada?: MachineResponseDTO;
  mensagemFeedback: string = '';

  opForm = new FormGroup({
    setor: new FormControl('', Validators.required),
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

    this.opForm.get('setor')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validarMaquinaSelecionadaParaSetor();
        this.validarSubOrdemSelecionadaParaMaquina(this.opForm.controls.idMaquina.value);
      });

    this.opForm.get('idMaquina')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        this.atualizarStatusMaquina(id);
      });

    this.opForm.get('idEtapaSubOrdem')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.sincronizarSetorPelaSubOrdem();
        this.atualizarExecucaoAtualPorSelecao();
      });

    interval(8000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sincronizarOperacao());
  }

  sincronizarOperacao() {
    this.carregarMaquinas();
    this.carregarOrdensPlanejadas();
    this.carregarExecucoes();
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
    this.sincronizarSetorPelaMaquina();
    this.validarSubOrdemSelecionadaParaMaquina(id);
    this.selecionarExecucaoAtivaDaMaquina(id);

    if (this.maquinaSelecionada?.statusOperacional === 'TRABALHANDO') {
      this.mensagemFeedback = 'Atenção: Este centro já está trabalhando.';
    } else if (this.maquinaSelecionada && !this.maquinaSelecionada.operacional) {
      this.mensagemFeedback = 'Atenção: Este centro está em manutenção.';
    } else {
      this.mensagemFeedback = '';
    }
  }

  carregarMaquinas() {
    this.machineService.buscarTodasMaquinas().subscribe({
      next: (dados) => {
        this.listaDeMaquinas = dados;
        this.atualizarStatusMaquina(this.opForm.controls.idMaquina.value);
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar centros.')
    });
  }

  carregarOrdensPlanejadas() {
    this.executionOrderService.listarOrdens().subscribe({
      next: (ordens) => {
        const codigoSelecionado = this.opForm.controls.idEtapaSubOrdem.value;
        this.listaDeOrdens = ordens.flatMap((ordem: OrderResponseDTO) =>
          (ordem.subOrdens || [])
            .filter((subOrdem) => {
              const temSaldo = (subOrdem.quantidadeProduzida || 0) < (subOrdem.quantidadeTotal || 0);
              const execucaoAberta = this.subOrdemTemExecucaoAberta(subOrdem.codigoEtapa);
              const liberada = subOrdem.status === 'AGUARDANDO' || !subOrdem.status;
              return temSaldo && (liberada || execucaoAberta || subOrdem.codigoEtapa === codigoSelecionado && execucaoAberta);
            })
            .map((subOrdem) => ({
              ...subOrdem,
              ordemNumero: ordem.numeroOrdem || '',
              produtoNome: ordem.produtoNome,
              produtoSku: ordem.produtoSku
            }))
        );
        this.validarSubOrdemSelecionadaParaMaquina(this.opForm.controls.idMaquina.value);
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar ordens planejadas.')
    });
  }

  get setoresDisponiveis(): string[] {
    const setoresDasMaquinas = this.listaDeMaquinas.map((maquina) => this.setorDaMaquina(maquina));
    const setoresDasOrdens = this.listaDeOrdens.map((ordem) => this.normalizarSetor(ordem.setor));
    const todos = new Set([...this.setoresProcesso, ...setoresDasMaquinas, ...setoresDasOrdens]);
    return [
      ...this.setoresProcesso.filter((setor) => todos.has(setor)),
      ...Array.from(todos).filter((setor) => !this.setoresProcesso.includes(setor)).sort()
    ];
  }

  get maquinasDisponiveisOperacao(): MachineResponseDTO[] {
    const setor = this.normalizarSetor(this.opForm.controls.setor.value, '');
    return this.listaDeMaquinas
      .filter((maquina) => !setor || this.setorDaMaquina(maquina) === setor)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }

  get ordensDisponiveisParaMaquina(): SubOrderOption[] {
    const maquinaId = this.opForm.controls.idMaquina.value;
    const setor = this.normalizarSetor(this.opForm.controls.setor.value, '');
    const maquina = this.listaDeMaquinas.find((item) => item.id === maquinaId);

    const ordens = this.listaDeOrdens
      .filter((ordem) => !setor || this.normalizarSetor(ordem.setor) === setor)
      .filter((ordem) => !maquina || this.itemCompativelComMaquina(ordem, maquina))
      .filter((ordem) => !maquinaId || !ordem.maquinaIdealId || ordem.maquinaIdealId === maquinaId);

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

  private validarMaquinaSelecionadaParaSetor() {
    const maquinaId = this.opForm.controls.idMaquina.value;
    const setor = this.normalizarSetor(this.opForm.controls.setor.value, '');
    if (!maquinaId || !setor) return;

    const maquina = this.listaDeMaquinas.find((item) => item.id === maquinaId);
    if (maquina && this.setorDaMaquina(maquina) !== setor) {
      this.opForm.controls.idMaquina.setValue('');
      this.maquinaSelecionada = undefined;
      this.execucaoAtual = undefined;
    }
  }

  private validarSubOrdemSelecionadaParaMaquina(maquinaId: string | null | undefined) {
    const codigoSelecionado = this.opForm.controls.idEtapaSubOrdem.value;
    if (!codigoSelecionado) return;

    const selecionada = this.listaDeOrdens.find((ordem) => ordem.codigoEtapa === codigoSelecionado);
    const maquina = this.listaDeMaquinas.find((item) => item.id === maquinaId);

    if (!selecionada) return;
    if (maquina && !this.itemCompativelComMaquina(selecionada, maquina)) {
      this.limparSubOrdemSelecionada();
      return;
    }

    if (maquinaId && selecionada.maquinaIdealId && selecionada.maquinaIdealId !== maquinaId) {
      this.limparSubOrdemSelecionada();
    }
  }

  private limparSubOrdemSelecionada() {
    this.opForm.controls.idEtapaSubOrdem.setValue('');
    this.execucaoAtual = undefined;
  }

  private subOrdemTemExecucaoAberta(codigoEtapa: string | undefined): boolean {
    if (!codigoEtapa) return false;
    return this.listaDeExecucoes.some((execucao) =>
      execucao.subOrdemId === codigoEtapa && this.statusExecucaoAberta(execucao.status)
    );
  }

  private statusExecucaoAberta(status: ExecutionResponseDTO['status'] | undefined): boolean {
    return status === 'RODANDO' || status === 'PAUSADA_POR_QUEBRA';
  }

  private execucaoAbertaDaMaquina(maquinaId: string | null | undefined): ExecutionResponseDTO | undefined {
    if (!maquinaId) return undefined;

    return this.listaDeExecucoes
      .filter((execucao) => execucao.maquinaId === maquinaId && this.statusExecucaoAberta(execucao.status))
      .sort((a, b) => (b.dataInicio || '').localeCompare(a.dataInicio || ''))[0];
  }

  private selecionarExecucaoAtivaDaMaquina(maquinaId: string | null | undefined) {
    const execucaoAberta = this.execucaoAbertaDaMaquina(maquinaId);
    if (!execucaoAberta?.id) return;

    this.execucaoAtual = execucaoAberta;
    if (execucaoAberta.subOrdemId && this.opForm.controls.idEtapaSubOrdem.value !== execucaoAberta.subOrdemId) {
      this.opForm.controls.idEtapaSubOrdem.setValue(execucaoAberta.subOrdemId, { emitEvent: false });
    }
    if (execucaoAberta.setor) {
      this.opForm.controls.setor.setValue(this.normalizarSetor(execucaoAberta.setor), { emitEvent: false });
    }
  }

  textoOpcaoOrdem(ordem: SubOrderOption): string {
    const proxima = this.proximaOrdemDaFila?.codigoEtapa === ordem.codigoEtapa ? 'Próxima | ' : '';
    const fila = ordem.maquinaIdealId ? `Fila ${this.posicaoAtualNaFila(ordem) || ordem.posicaoFila || '-'}` : 'Sem centro';
    const etapa = `${ordem.nomeEtapa || ordem.setor || 'ETAPA'} / ${this.textoSetor(ordem.setor)}`;
    return `${proxima}${ordem.codigoEtapa} | ${etapa} | ${ordem.quantidadeProduzida || 0} / ${ordem.quantidadeTotal} peças | ${fila}`;
  }

  private posicaoAtualNaFila(ordem: SubOrderOption): number | null {
    const indice = this.ordensDisponiveisParaMaquina.findIndex((item) => item.codigoEtapa === ordem.codigoEtapa);
    return indice >= 0 ? indice + 1 : null;
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
    const setor = this.textoSetor(this.opForm.controls.setor.value);
    if (!maquinaId) return `Selecione um centro de ${setor} para visualizar a fila disponível.`;

    const maquina = this.listaDeMaquinas.find((item) => item.id === maquinaId)?.nome || 'centro selecionado';
    const total = this.ordensDisponiveisParaMaquina.length;
    if (total === 0) return `Nenhuma etapa disponível para ${maquina}.`;

    const primeira = this.ordensDisponiveisParaMaquina[0];
    const prefixo = total === 1 ? '1 etapa disponível' : `${total} etapas disponíveis`;
    return `${prefixo} para ${maquina}. Próxima: ${primeira.codigoEtapa || '-'}.`;
  }

  carregarExecucoes() {
    this.executionOrderService.listarTodas().subscribe({
      next: (execucoes) => {
        this.listaDeExecucoes = execucoes;
        this.atualizarExecucaoAtualPorSelecao();
        this.garantirSubOrdemAtivaNaLista();
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar execuções em andamento.')
    });
  }

  get subOrdemSelecionada(): SubOrderOption | undefined {
    const codigoEtapa = this.opForm.controls.idEtapaSubOrdem.value;
    return this.listaDeOrdens.find((ordem) => ordem.codigoEtapa === codigoEtapa);
  }

  get saldoSelecionado(): string {
    const subOrdem = this.subOrdemSelecionada;
    if (!subOrdem && this.execucaoAtual?.quantidadeTotal !== undefined) {
      return `${this.execucaoAtual.quantidadeProduzida || 0} / ${this.execucaoAtual.quantidadeTotal || 0} PEÇAS`;
    }
    if (!subOrdem) return '0 / 0 PEÇAS';

    return `${subOrdem.quantidadeProduzida || 0} / ${subOrdem.quantidadeTotal || 0} PEÇAS`;
  }

  get loteSelecionado(): string {
    return this.subOrdemSelecionada?.codigoEtapa || this.execucaoAtual?.subOrdemId || '-';
  }

  get etapaSelecionada(): string {
    const subOrdem = this.subOrdemSelecionada;
    return subOrdem?.nomeEtapa || this.execucaoAtual?.nomeEtapa || '-';
  }

  get setorSelecionadoTexto(): string {
    const subOrdem = this.subOrdemSelecionada;
    return this.textoSetor(subOrdem?.setor || this.execucaoAtual?.setor || this.opForm.controls.setor.value);
  }

  get produtoSelecionado(): string {
    const subOrdem = this.subOrdemSelecionada;
    return subOrdem?.produtoNome || subOrdem?.produtoSku || '-';
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

  get execucaoRodando(): boolean {
    return this.execucaoAtual?.status === 'RODANDO';
  }

  get execucaoPausada(): boolean {
    return this.execucaoAtual?.status === 'PAUSADA_POR_QUEBRA';
  }

  get podeIniciar(): boolean {
    return this.opForm.valid && this.maquinaPodeIniciar && !this.execucaoAtual;
  }

  get podePausar(): boolean {
    return this.execucaoRodando;
  }

  get podeRetomar(): boolean {
    return this.execucaoPausada;
  }

  get podeFinalizarSetup(): boolean {
    return this.execucaoRodando && !!this.execucaoAtual?.setupPrimeiraPeca;
  }

  get podeEnviarManutencao(): boolean {
    return !!this.opForm.controls.idMaquina.value && this.maquinaSelecionada?.statusOperacional !== 'MANUTENCAO';
  }

  get podeFinalizar(): boolean {
    const quantidadeProduzida = this.opForm.controls.quantidadeProduzida.value || 0;
    return !!this.execucaoAtual?.id && quantidadeProduzida > 0 && (this.execucaoRodando || this.execucaoPausada);
  }

  private atualizarExecucaoAtualPorSelecao() {
    const codigoEtapa = this.opForm.controls.idEtapaSubOrdem.value;
    const maquinaId = this.opForm.controls.idMaquina.value;

    if (!codigoEtapa) {
      this.execucaoAtual = this.execucaoAbertaDaMaquina(maquinaId);
      return;
    }

    const execucaoSelecionada = this.listaDeExecucoes
      .filter((execucao) =>
        execucao.subOrdemId === codigoEtapa &&
        this.statusExecucaoAberta(execucao.status)
      )
      .sort((a, b) => (b.dataInicio || '').localeCompare(a.dataInicio || ''))[0];

    this.execucaoAtual = execucaoSelecionada || this.execucaoAbertaDaMaquina(maquinaId);
  }

  private garantirSubOrdemAtivaNaLista() {
    const codigoEtapa = this.execucaoAtual?.subOrdemId;
    if (!codigoEtapa) return;

    const existeNaLista = this.listaDeOrdens.some((ordem) => ordem.codigoEtapa === codigoEtapa);
    if (!existeNaLista) {
      this.carregarOrdensPlanejadas();
    }
  }

  onIniciar() {
    if (!this.podeIniciar) return;

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
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao iniciar produção.')
    });
  }

  onPausar() {
    if (!this.podePausar || !this.execucaoAtual?.id) {
      this.mensagemFeedback = 'A produção precisa estar rodando para pausar.';
      return;
    }

    this.executionOrderService.pausar(this.execucaoAtual.id).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.listaDeExecucoes = this.listaDeExecucoes.map((item) => item.id === execucao.id ? execucao : item);
        this.mensagemFeedback = 'Produção pausada por quebra. O tempo produtivo parou de contar.';
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao pausar produção.')
    });
  }

  onManutencao() {
    const idMaquina = this.opForm.controls.idMaquina.value;

    if (!idMaquina || !this.podeEnviarManutencao) {
      this.mensagemFeedback = 'Selecione um centro disponível ou trabalhando para enviar para manutenção.';
      return;
    }

    if (this.maquinaSelecionada?.statusOperacional === 'MANUTENCAO') {
      this.mensagemFeedback = 'Este centro já está em manutenção.';
      return;
    }

    this.machineService.enviarParaManutencao(idMaquina).subscribe({
      next: () => {
        this.mensagemFeedback = 'Centro enviado para manutenção. A etapa ativa voltou para a fila.';
        this.execucaoAtual = undefined;
        this.opForm.patchValue({ idEtapaSubOrdem: '', quantidadeProduzida: 1, setupPrimeiraPeca: false });
        this.carregarMaquinas();
        this.carregarOrdensPlanejadas();
        this.carregarExecucoes();
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao enviar centro para manutenção.')
    });
  }

  onRetomar() {
    if (!this.podeRetomar || !this.execucaoAtual?.id) {
      this.mensagemFeedback = 'Não há execução pausada para retomar.';
      return;
    }

    this.executionOrderService.retomar(this.execucaoAtual.id).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.listaDeExecucoes = this.listaDeExecucoes.map((item) => item.id === execucao.id ? execucao : item);
        this.mensagemFeedback = 'Produção retomada. O tempo produtivo voltou a contar.';
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao retomar produção.')
    });
  }

  onFinalizarSetup() {
    if (!this.podeFinalizarSetup || !this.execucaoAtual?.id) {
      this.mensagemFeedback = 'O setup só pode ser finalizado com a produção rodando.';
      return;
    }

    this.executionOrderService.finalizarSetup(this.execucaoAtual.id).subscribe({
      next: (execucao) => {
        this.execucaoAtual = execucao;
        this.listaDeExecucoes = this.listaDeExecucoes.map((item) => item.id === execucao.id ? execucao : item);
        this.mensagemFeedback = 'Setup da primeira peça registrado. O restante do lote será calculado separado.';
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao finalizar setup.')
    });
  }

  onFinalizar() {
    const quantidadeProduzida = this.opForm.controls.quantidadeProduzida.value || 0;

    if (!this.podeFinalizar || !this.execucaoAtual?.id || quantidadeProduzida <= 0) {
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
        this.opForm.reset({ setor: '', idMaquina: '', idEtapaSubOrdem: '', quantidadeProduzida: 1, setupPrimeiraPeca: false });
        this.carregarMaquinas();
        this.carregarOrdensPlanejadas();
        this.carregarExecucoes();
      },
      error: (err) => this.mensagemFeedback = apiErrorMessage(err, 'Erro ao finalizar apontamento.')
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

  textoSetor(setor?: string | null): string {
    const normalizado = this.normalizarSetor(setor);
    if (normalizado === 'INSPECAO') return 'INSPEÇÃO';
    if (normalizado === 'EXPEDICAO') return 'EXPEDIÇÃO';
    return normalizado;
  }

  private sincronizarSetorPelaMaquina() {
    if (!this.maquinaSelecionada) return;
    const setor = this.setorDaMaquina(this.maquinaSelecionada);
    if (this.opForm.controls.setor.value !== setor) {
      this.opForm.controls.setor.setValue(setor, { emitEvent: false });
    }
  }

  private sincronizarSetorPelaSubOrdem() {
    const subOrdem = this.subOrdemSelecionada;
    if (!subOrdem?.setor) return;
    const setor = this.normalizarSetor(subOrdem.setor);
    if (this.opForm.controls.setor.value !== setor) {
      this.opForm.controls.setor.setValue(setor, { emitEvent: false });
    }
  }

  private itemCompativelComMaquina(ordem: SubOrderOption, maquina: MachineResponseDTO): boolean {
    return this.normalizarSetor(ordem.setor) === this.setorDaMaquina(maquina);
  }

  private setorDaMaquina(maquina: MachineResponseDTO): string {
    return this.normalizarSetor(maquina.setor);
  }

  private normalizarSetor(valor?: string | null, padrao = 'USINAGEM'): string {
    const normalizado = (valor || '').trim().toUpperCase();
    return normalizado || padrao;
  }
}
