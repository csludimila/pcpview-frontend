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
  execucoesAbertas: ExecutionResponseDTO[] = [];

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
        this.execucoesAbertas = execucoes.filter((execucao) => this.execucaoEstaAberta(execucao));
        this.ordensFinalizadas = ordens.filter((ordem) => this.estaFinalizada(ordem));
        this.ordensProducao = ordens.filter((ordem) => !this.estaFinalizada(ordem) && ordem.status === 'EM_PROCESSAMENTO');
        this.ordensAguardando = ordens.filter((ordem) => !this.estaFinalizada(ordem) && ordem.status !== 'EM_PROCESSAMENTO');
        this.ordenarPorFila(this.ordensAguardando);
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

  formatarDuracao(segundos?: number): string {
    if (!segundos) return '0s';

    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const seg = Math.floor(segundos % 60);

    if (horas > 0) return `${horas}h ${minutos}min ${seg}s`;
    if (minutos > 0) return `${minutos}min ${seg}s`;
    return `${seg}s`;
  }

  formatarData(data?: string): string {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  }

  maquinaIdeal(ordem: OrderResponseDTO): string {
    return this.subOrdemPrincipal(ordem)?.maquinaIdealNome || 'Sem máquina definida';
  }

  posicaoFila(ordem: OrderResponseDTO): string {
    const posicao = this.subOrdemPrincipal(ordem)?.posicaoFila;
    return posicao ? String(posicao) : '-';
  }

  classeFila(ordem: OrderResponseDTO): string {
    return this.subOrdemPrincipal(ordem)?.posicaoFila ? 'queue-position' : 'queue-position queue-unassigned';
  }

  codigoLote(ordem: OrderResponseDTO): string {
    return this.subOrdemPrincipal(ordem)?.codigoEtapa || ordem.numeroOrdem || '-';
  }

  codigoFinalizado(ordem: OrderResponseDTO): string {
    return this.codigoLote(ordem) || ordem.numeroOrdem || '-';
  }

  produtoOrdem(ordem: OrderResponseDTO): string {
    return ordem.produtoNome || ordem.produtoSku || '-';
  }

  maquinaProducao(ordem: OrderResponseDTO): string {
    return this.execucaoAtivaDaOrdem(ordem)?.maquinaNome || this.maquinaIdeal(ordem);
  }

  operadorProducao(ordem: OrderResponseDTO): string {
    return this.execucaoAtivaDaOrdem(ordem)?.operadorNome || '-';
  }

  textoStatusProducao(ordem: OrderResponseDTO): string {
    const status = this.execucaoAtivaDaOrdem(ordem)?.status;
    return status === 'PAUSADA_POR_QUEBRA' ? 'PAUSADA' : 'PRODUZINDO';
  }

  classeStatusProducao(ordem: OrderResponseDTO): string {
    const status = this.execucaoAtivaDaOrdem(ordem)?.status;
    return status === 'PAUSADA_POR_QUEBRA'
      ? 'status-badge status-pausado'
      : 'status-badge status-producao';
  }

  temPesquisa(): boolean {
    return this.termoPesquisa.trim().length > 0;
  }

  private filtrarOrdens(ordens: OrderResponseDTO[]): OrderResponseDTO[] {
    const termo = this.normalizarTexto(this.termoPesquisa);
    if (!termo) return ordens;

    return ordens.filter((ordem) => {
      const subOrdem = this.subOrdemPrincipal(ordem);
      const campos = [
        ordem.numeroOrdem,
        ordem.produtoNome,
        ordem.produtoSku,
        subOrdem?.codigoEtapa,
        subOrdem?.maquinaIdealNome
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
    const quantidadeTotal = ordem.quantidadeTotal || this.subOrdemPrincipal(ordem)?.quantidadeTotal || 0;
    const quantidadeProduzida = ordem.quantidadeProduzida || this.subOrdemPrincipal(ordem)?.quantidadeProduzida || 0;

    return ordem.status === 'FINALIZADO' || (quantidadeTotal > 0 && quantidadeProduzida >= quantidadeTotal);
  }

  private ordenarPorFila(ordens: OrderResponseDTO[]) {
    ordens.sort((a, b) => {
      const maquinaA = this.subOrdemPrincipal(a)?.maquinaIdealNome || 'ZZZ';
      const maquinaB = this.subOrdemPrincipal(b)?.maquinaIdealNome || 'ZZZ';
      const maquinaCompare = maquinaA.localeCompare(maquinaB);
      if (maquinaCompare !== 0) return maquinaCompare;

      const posicaoA = this.subOrdemPrincipal(a)?.posicaoFila || Number.MAX_SAFE_INTEGER;
      const posicaoB = this.subOrdemPrincipal(b)?.posicaoFila || Number.MAX_SAFE_INTEGER;
      return posicaoA - posicaoB;
    });
  }

  private subOrdemPrincipal(ordem: OrderResponseDTO): SubOrderResponseDTO | undefined {
    return ordem.subOrdens?.[0];
  }

  private execucaoAtivaDaOrdem(ordem: OrderResponseDTO): ExecutionResponseDTO | undefined {
    const codigosSubOrdens = new Set((ordem.subOrdens || []).map((subOrdem) => subOrdem.codigoEtapa));
    return this.execucoesAbertas.find((execucao) => execucao.subOrdemId && codigosSubOrdens.has(execucao.subOrdemId));
  }

  private execucaoEstaAberta(execucao: ExecutionResponseDTO): boolean {
    return execucao.status === 'RODANDO' || execucao.status === 'PAUSADA_POR_QUEBRA';
  }
}
