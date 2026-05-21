import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExecutionOrderService } from '../app/services/execution-order.service';
import { OrderResponseDTO, SubOrderResponseDTO } from '../app/models/api.models';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-tracking.html',
  styleUrls: ['./order-tracking.css']
})
export class OrderTrackingComponent implements OnInit {
  private executionService = inject(ExecutionOrderService);

  abaAtiva: 'aguardando' | 'producao' | 'finalizadas' = 'aguardando';
  isCarregando = false;
  termoPesquisa = '';

  ordensAguardando: OrderResponseDTO[] = [];
  ordensProducao: OrderResponseDTO[] = [];
  ordensFinalizadas: OrderResponseDTO[] = [];

  ngOnInit() {
    this.carregarDados();
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

  carregarDados() {
    this.isCarregando = true;
    this.executionService.listarOrdens().subscribe({
      next: (ordens) => {
        this.ordensAguardando = ordens.filter((o) => o.status === 'AGUARDANDO' || !o.status);
        this.ordensProducao = ordens.filter((o) => o.status === 'EM_PROCESSAMENTO');
        this.ordensFinalizadas = ordens.filter((o) => o.status === 'FINALIZADO');
        this.ordenarPorFila(this.ordensAguardando);
        this.isCarregando = false;
      },
      error: (err: any) => {
        this.isCarregando = false;
        const errorMessage = err?.message || 'Erro desconhecido ao sincronizar ordens.';
        console.error('Erro no componente:', errorMessage);
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

  produtoOrdem(ordem: OrderResponseDTO): string {
    return ordem.produtoNome || ordem.produtoSku || '-';
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
}
