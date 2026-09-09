import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval } from 'rxjs';
import { ExecutionOrderService } from '../app/services/execution-order.service';
import { ExecutionResponseDTO, OrderResponseDTO, SubOrderResponseDTO } from '../app/models/api.models';
import { apiErrorMessage } from '../app/shared/api-error';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-tracking.html',
  styleUrls: ['./order-tracking.css']
})
export class OrderTrackingComponent implements OnInit {
  private executionService = inject(ExecutionOrderService);
  private destroyRef = inject(DestroyRef);

  abaAtiva: 'aguardando' | 'producao' | 'finalizadas' = 'aguardando';
  isCarregando = false;
  termoPesquisa = '';
  mensagemFeedback = '';

  ordensAguardando: OrderResponseDTO[] = [];
  ordensProducao: OrderResponseDTO[] = [];
  ordensFinalizadas: OrderResponseDTO[] = [];
  execucoes: ExecutionResponseDTO[] = [];

  ngOnInit() {
    this.carregarDados();
    interval(8000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregarDados(true));
  }

  mudarAba(novaAba: 'aguardando' | 'producao' | 'finalizadas') {
    this.abaAtiva = novaAba;
  }

  get ordensAguardandoFiltradas(): OrderResponseDTO[] {
    return this.filtrarOrdens(this.ordensAguardando);
  }

  get ordensProducaoFiltradas(): OrderResponseDTO[] {
    return this.filtrarOrdens(this.ordensProducao);
  }

  get ordensFinalizadasFiltradas(): OrderResponseDTO[] {
    return this.filtrarOrdens(this.ordensFinalizadas);
  }

  carregarDados(silencioso = false) {
    if (!silencioso) {
      this.isCarregando = true;
    }

    forkJoin({
      ordens: this.executionService.listarOrdens(),
      execucoes: this.executionService.listarTodas()
    }).subscribe({
      next: ({ ordens, execucoes }) => {
        this.mensagemFeedback = '';
        this.execucoes = execucoes;
        this.ordensFinalizadas = ordens.filter((ordem) => this.estaFinalizada(ordem));
        this.ordensProducao = ordens.filter((ordem) => !this.estaFinalizada(ordem) && this.temExecucaoAberta(ordem));
        this.ordensAguardando = ordens.filter((ordem) => !this.estaFinalizada(ordem) && !this.temExecucaoAberta(ordem));
        this.ordenarPorPrioridade(this.ordensAguardando);
        this.ordenarPorPrioridade(this.ordensProducao);
        this.ordenarPorPrioridade(this.ordensFinalizadas);
        this.isCarregando = false;
      },
      error: (err: unknown) => {
        if (!silencioso) {
          this.isCarregando = false;
        }
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao sincronizar acompanhamento.');
      }
    });
  }

  formatarData(data?: string): string {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  }

  quantidadeOrdem(ordem: OrderResponseDTO): string {
    return `${ordem.quantidadeProduzida || 0} / ${ordem.quantidadeTotal || 0}`;
  }

  progressoOrdem(ordem: OrderResponseDTO): number {
    const total = ordem.quantidadeTotal || 0;
    const produzida = ordem.quantidadeProduzida || 0;
    if (total <= 0) return 0;

    return Math.min(100, Math.round((produzida / total) * 100));
  }

  linhaProcesso(ordem: OrderResponseDTO): SubOrderResponseDTO[] {
    return [...(ordem.subOrdens || [])].sort((a, b) => (a.codigoEtapa || '').localeCompare(b.codigoEtapa || ''));
  }

  classeEtapaRoteiro(etapa: SubOrderResponseDTO): string {
    if (this.etapaFinalizada(etapa)) return 'route-chip done';
    if (this.execucaoAtivaDaEtapa(etapa.codigoEtapa)) return 'route-chip active';
    return 'route-chip waiting';
  }

  textoStatusOrdem(ordem: OrderResponseDTO): string {
    if (this.estaFinalizada(ordem)) return 'FINALIZADA';
    if (this.temExecucaoAberta(ordem)) return 'EM PRODUÇÃO';
    return 'AGUARDANDO';
  }

  classeStatusOrdem(ordem: OrderResponseDTO): string {
    if (this.estaFinalizada(ordem)) return 'status-badge status-finalizado';
    if (this.temExecucaoAberta(ordem)) return 'status-badge status-producao';
    return 'status-badge status-aguardando';
  }

  execucaoAtivaDaOrdem(ordem: OrderResponseDTO): ExecutionResponseDTO | undefined {
    const codigosSubOrdens = new Set((ordem.subOrdens || []).map((subOrdem) => subOrdem.codigoEtapa));
    return this.execucoes.find((execucao) =>
      execucao.status === 'RODANDO' &&
      !!execucao.subOrdemId &&
      codigosSubOrdens.has(execucao.subOrdemId)
    );
  }

  execucaoFinalDaOrdem(ordem: OrderResponseDTO): ExecutionResponseDTO | undefined {
    const codigosSubOrdens = new Set((ordem.subOrdens || []).map((subOrdem) => subOrdem.codigoEtapa));
    return this.execucoes
      .filter((execucao) => execucao.status === 'FINALIZADA' && !!execucao.subOrdemId && codigosSubOrdens.has(execucao.subOrdemId))
      .sort((a, b) => (b.dataFim || '').localeCompare(a.dataFim || ''))[0];
  }

  temPesquisa(): boolean {
    return this.termoPesquisa.trim().length > 0;
  }

  trackOrdem(_: number, ordem: OrderResponseDTO): string {
    return ordem.numeroOrdem || '';
  }

  trackSubOrdem(_: number, subOrdem: SubOrderResponseDTO): string {
    return subOrdem.codigoEtapa || '';
  }

  private filtrarOrdens(ordens: OrderResponseDTO[]): OrderResponseDTO[] {
    const termo = this.normalizarTexto(this.termoPesquisa);
    if (!termo) return ordens;

    return ordens.filter((ordem) => {
      const campos = [
        ordem.numeroOrdem,
        String(ordem.prioridade || ''),
        ...this.linhaProcesso(ordem).map((subOrdem) => subOrdem.codigoEtapa)
      ];

      return campos.some((campo) => this.normalizarTexto(campo).includes(termo));
    });
  }

  private normalizarTexto(valor?: string | null): string {
    return (valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private estaFinalizada(ordem: OrderResponseDTO): boolean {
    const quantidadeTotal = ordem.quantidadeTotal || 0;
    const quantidadeProduzida = ordem.quantidadeProduzida || 0;
    if (quantidadeTotal > 0 && quantidadeProduzida >= quantidadeTotal) return true;

    const subOrdens = this.linhaProcesso(ordem);
    return subOrdens.length > 0 && subOrdens.every((subOrdem) => this.etapaFinalizada(subOrdem));
  }

  private etapaFinalizada(etapa: SubOrderResponseDTO): boolean {
    const total = etapa.quantidadeTotal || 0;
    const produzida = etapa.quantidadeProduzida || 0;
    return total > 0 && produzida >= total;
  }

  private ordenarPorPrioridade(ordens: OrderResponseDTO[]) {
    ordens.sort((a, b) => {
      const prioridadeA = a.prioridade || 5;
      const prioridadeB = b.prioridade || 5;
      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;

      return (a.dataCriacao || '').localeCompare(b.dataCriacao || '');
    });
  }

  private temExecucaoAberta(ordem: OrderResponseDTO): boolean {
    return !!this.execucaoAtivaDaOrdem(ordem);
  }

  private execucaoAtivaDaEtapa(codigoEtapa: string | undefined): ExecutionResponseDTO | undefined {
    if (!codigoEtapa) return undefined;
    return this.execucoes.find((execucao) => execucao.status === 'RODANDO' && execucao.subOrdemId === codigoEtapa);
  }
}
