import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExecutionOrderService, StatusProducao } from '../../services/execution-order.service';
import { OrderRequestDTO, OrderResponseDTO, SubOrderResponseDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';

interface SubconjuntoUI {
  letra: string;
  quantidadeEtapas: number;
}

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.html',
  styleUrls: ['./order-form.css']
})
export class OrderFormComponent implements OnInit {
  private orderService = inject(ExecutionOrderService);

  readonly statusOptions: StatusProducao[] = ['AGUARDANDO', 'EM_PROCESSAMENTO', 'FINALIZADO', 'CANCELADO'];
  readonly prioridadeOptions = [1, 2, 3, 4, 5];

  ordens: OrderResponseDTO[] = [];
  subconjuntos: SubconjuntoUI[] = [{ letra: 'A', quantidadeEtapas: 1 }];

  novaOrdem = {
    numeroOrdem: '',
    quantidadeTotal: 1
  };

  ordemParaExcluir = '';
  ordemExclusaoPendente = '';
  subOrdemExclusaoPendente = '';
  isCarregando = false;
  mensagemFeedback = '';

  quantidadeEdicao: Record<string, number> = {};
  prioridadeEdicao: Record<string, number> = {};
  statusOrdemEdicao: Record<string, StatusProducao | ''> = {};
  letraNovaSubOrdem: Record<string, string> = {};
  statusSubOrdemEdicao: Record<string, StatusProducao | ''> = {};

  get totalEtapasPlanejadas(): number {
    return this.subconjuntos.reduce((total, item) => total + this.quantidadeEtapasValida(item), 0);
  }

  get textoResumoSubconjuntos(): string {
    const totalSubconjuntos = this.subconjuntos.length;
    const totalEtapas = this.totalEtapasPlanejadas;
    const textoSubconjuntos = totalSubconjuntos === 1 ? '1 subconjunto' : `${totalSubconjuntos} subconjuntos`;
    const textoEtapas = totalEtapas === 1 ? '1 etapa' : `${totalEtapas} etapas`;

    return `${textoSubconjuntos}, ${textoEtapas} geradas pelo back-end.`;
  }

  get codigoOrdemNormalizado(): string {
    return this.normalizarTextoMaiusculo(this.novaOrdem.numeroOrdem);
  }

  get ordemJaExiste(): boolean {
    const codigo = this.codigoOrdemNormalizado;
    return !!codigo && this.ordens.some((ordem) => this.normalizarTextoMaiusculo(ordem.numeroOrdem || '') === codigo);
  }

  get podeGerarOrdem(): boolean {
    const quantidadeTotal = Number(this.novaOrdem.quantidadeTotal);
    return !!this.codigoOrdemNormalizado &&
      Number.isInteger(quantidadeTotal) &&
      quantidadeTotal > 0 &&
      this.totalEtapasPlanejadas > 0 &&
      !this.ordemJaExiste &&
      !this.isCarregando;
  }

  ngOnInit() {
    this.carregarOrdens();
  }

  carregarOrdens() {
    this.orderService.listarOrdens().subscribe({
      next: (dados) => {
        this.ordens = dados;
        this.prepararCamposEdicao(dados);
        if (this.ordemExclusaoPendente && !dados.some((ordem) => ordem.numeroOrdem === this.ordemExclusaoPendente)) {
          this.ordemExclusaoPendente = '';
        }
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar ordens de produção.');
      }
    });
  }

  normalizarNumeroOrdemCampo() {
    this.novaOrdem.numeroOrdem = this.codigoOrdemNormalizado;
  }

  atualizarNumeroOrdemDigitado(valor: string) {
    this.novaOrdem.numeroOrdem = this.converterTextoMaiusculo(valor);
  }

  atualizarLetraSubconjunto(item: SubconjuntoUI, valor: string) {
    item.letra = this.normalizarLetra(valor);
  }

  adicionarSubconjunto() {
    this.subconjuntos.push({
      letra: this.proximaLetraDisponivel(),
      quantidadeEtapas: 1
    });
  }

  removerSubconjunto(index: number) {
    if (this.subconjuntos.length === 1) {
      this.mensagemFeedback = 'Mantenha pelo menos um subconjunto para gerar a OF.';
      return;
    }

    this.subconjuntos.splice(index, 1);
  }

  gerarOrdem() {
    const numeroOrdem = this.codigoOrdemNormalizado;
    const quantidadeTotal = Number(this.novaOrdem.quantidadeTotal);
    const subconjuntos = this.montarSubconjuntosPayload();

    if (!numeroOrdem || !Number.isInteger(quantidadeTotal) || quantidadeTotal <= 0) {
      this.mensagemFeedback = 'Preencha o número da OF e uma quantidade maior que zero.';
      return;
    }

    if (subconjuntos.length === 0) {
      this.mensagemFeedback = 'Informe pelo menos um subconjunto com letra e quantidade de etapas.';
      return;
    }

    if (this.ordemJaExiste) {
      this.mensagemFeedback = 'Já existe uma ordem de produção com esse código.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';

    const payload: OrderRequestDTO = {
      numeroOrdem,
      quantidadeTotal,
      subconjuntos
    };

    this.orderService.criarOrdemComEtapas(payload).subscribe({
      next: () => {
        this.mensagemFeedback = `Ordem criada com sucesso. ${this.textoResumoSubconjuntos}`;
        this.novaOrdem = { numeroOrdem: '', quantidadeTotal: 1 };
        this.subconjuntos = [{ letra: 'A', quantidadeEtapas: 1 }];
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao criar ordem de produção.');
        this.isCarregando = false;
      }
    });
  }

  alterarQuantidade(ordem: OrderResponseDTO) {
    const numeroOrdem = ordem.numeroOrdem;
    const quantidade = numeroOrdem ? Number(this.quantidadeEdicao[numeroOrdem]) : 0;

    if (!numeroOrdem || !Number.isInteger(quantidade) || quantidade < 1) {
      this.mensagemFeedback = 'Informe uma quantidade válida para atualizar a ordem.';
      return;
    }

    this.isCarregando = true;
    this.orderService.alterarQuantidadeOrdem(numeroOrdem, quantidade).subscribe({
      next: () => {
        this.mensagemFeedback = 'Quantidade da ordem atualizada com sucesso.';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao atualizar quantidade da ordem.');
        this.isCarregando = false;
      }
    });
  }

  alterarPrioridade(ordem: OrderResponseDTO) {
    const numeroOrdem = ordem.numeroOrdem;
    const prioridade = numeroOrdem ? Number(this.prioridadeEdicao[numeroOrdem]) : 0;

    if (!numeroOrdem || !this.prioridadeOptions.includes(prioridade)) {
      this.mensagemFeedback = 'Escolha uma prioridade de 1 a 5.';
      return;
    }

    this.isCarregando = true;
    this.orderService.alterarPrioridadeOrdem(numeroOrdem, prioridade).subscribe({
      next: () => {
        this.mensagemFeedback = 'Prioridade da ordem atualizada com sucesso.';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao atualizar prioridade.');
        this.isCarregando = false;
      }
    });
  }

  alterarStatusOrdem(ordem: OrderResponseDTO) {
    const numeroOrdem = ordem.numeroOrdem;
    const status = numeroOrdem ? this.statusOrdemEdicao[numeroOrdem] : '';

    if (!numeroOrdem || !status) {
      this.mensagemFeedback = 'Escolha um status para alterar a ordem.';
      return;
    }

    this.isCarregando = true;
    this.orderService.alterarStatusOrdem(numeroOrdem, status).subscribe({
      next: () => {
        this.mensagemFeedback = 'Status da ordem enviado ao back-end.';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao atualizar status da ordem.');
        this.isCarregando = false;
      }
    });
  }

  criarNovaSubOrdem(ordem: OrderResponseDTO) {
    const numeroOrdem = ordem.numeroOrdem;
    const letra = numeroOrdem ? this.normalizarLetra(this.letraNovaSubOrdem[numeroOrdem] || 'A') : '';

    if (!numeroOrdem || !letra) {
      this.mensagemFeedback = 'Informe a letra do subconjunto para criar a nova etapa.';
      return;
    }

    this.isCarregando = true;
    this.orderService.criarSubOrdem(numeroOrdem, letra).subscribe({
      next: () => {
        this.mensagemFeedback = 'Nova etapa criada com sucesso.';
        this.letraNovaSubOrdem[numeroOrdem] = '';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao criar nova etapa.');
        this.isCarregando = false;
      }
    });
  }

  alterarStatusSubOrdem(subOrdem: SubOrderResponseDTO) {
    const codigoEtapa = subOrdem.codigoEtapa;
    const status = codigoEtapa ? this.statusSubOrdemEdicao[codigoEtapa] : '';

    if (!codigoEtapa || !status) {
      this.mensagemFeedback = 'Escolha um status para alterar a etapa.';
      return;
    }

    this.isCarregando = true;
    this.orderService.alterarStatusSubOrdem(codigoEtapa, status).subscribe({
      next: () => {
        this.mensagemFeedback = 'Status da etapa enviado ao back-end.';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao atualizar status da etapa.');
        this.isCarregando = false;
      }
    });
  }

  excluirSubOrdem(codigoEtapa?: string) {
    if (!codigoEtapa) return;

    if (this.subOrdemExclusaoPendente !== codigoEtapa) {
      this.subOrdemExclusaoPendente = codigoEtapa;
      this.mensagemFeedback = 'Clique novamente em excluir etapa para confirmar.';
      return;
    }

    this.isCarregando = true;
    this.orderService.excluirSubOrdem(codigoEtapa).subscribe({
      next: () => {
        this.mensagemFeedback = 'Etapa excluída com sucesso.';
        this.subOrdemExclusaoPendente = '';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao excluir etapa.');
        this.subOrdemExclusaoPendente = '';
        this.isCarregando = false;
      }
    });
  }

  excluirOrdem() {
    if (!this.ordemParaExcluir) return;

    if (this.ordemExclusaoPendente !== this.ordemParaExcluir) {
      this.ordemExclusaoPendente = this.ordemParaExcluir;
      this.mensagemFeedback = 'Clique novamente em excluir para confirmar a remoção da ordem.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';
    this.orderService.excluirOrdem(this.ordemParaExcluir).subscribe({
      next: () => {
        this.mensagemFeedback = 'Ordem excluída com sucesso.';
        this.ordemParaExcluir = '';
        this.ordemExclusaoPendente = '';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao excluir ordem. Ela pode já ter entrado em produção.');
        this.ordemExclusaoPendente = '';
        this.isCarregando = false;
      }
    });
  }

  trackSubconjunto(index: number): number {
    return index;
  }

  trackOrdem(_: number, ordem: OrderResponseDTO): string {
    return ordem.numeroOrdem || '';
  }

  trackSubOrdem(_: number, subOrdem: SubOrderResponseDTO): string {
    return subOrdem.codigoEtapa || '';
  }

  progressoPercentual(item: OrderResponseDTO | SubOrderResponseDTO): number {
    const total = item.quantidadeTotal || 0;
    const produzida = item.quantidadeProduzida || 0;
    if (total <= 0) return 0;

    return Math.min(100, Math.round((produzida / total) * 100));
  }

  formatarData(data?: string): string {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  }

  private montarSubconjuntosPayload(): NonNullable<OrderRequestDTO['subconjuntos']> {
    return this.subconjuntos
      .map((item) => ({
        letra: this.normalizarLetra(item.letra),
        quantidadeEtapas: this.quantidadeEtapasValida(item)
      }))
      .filter((item) => !!item.letra && item.quantidadeEtapas > 0);
  }

  private quantidadeEtapasValida(item: SubconjuntoUI): number {
    const quantidade = Number(item.quantidadeEtapas);
    return Number.isInteger(quantidade) && quantidade > 0 ? quantidade : 0;
  }

  private prepararCamposEdicao(ordens: OrderResponseDTO[]) {
    ordens.forEach((ordem) => {
      if (!ordem.numeroOrdem) return;

      this.quantidadeEdicao[ordem.numeroOrdem] = ordem.quantidadeTotal || 1;
      this.prioridadeEdicao[ordem.numeroOrdem] = ordem.prioridade || 5;
      this.statusOrdemEdicao[ordem.numeroOrdem] = '';
      this.letraNovaSubOrdem[ordem.numeroOrdem] ||= '';

      (ordem.subOrdens || []).forEach((subOrdem) => {
        if (subOrdem.codigoEtapa) {
          this.statusSubOrdemEdicao[subOrdem.codigoEtapa] = '';
        }
      });
    });
  }

  private proximaLetraDisponivel(): string {
    const usadas = new Set(this.subconjuntos.map((item) => this.normalizarLetra(item.letra)));

    for (let codigo = 65; codigo <= 90; codigo++) {
      const letra = String.fromCharCode(codigo);
      if (!usadas.has(letra)) return letra;
    }

    return 'A';
  }

  private normalizarLetra(valor: string): string {
    return this.converterTextoMaiusculo(valor).replace(/[^A-Z]/g, '').slice(0, 1);
  }

  private normalizarTextoMaiusculo(valor: string): string {
    return this.converterTextoMaiusculo(valor).trim();
  }

  private converterTextoMaiusculo(valor: string): string {
    return (valor || '').toUpperCase();
  }
}
