import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachineService, MachineDTO } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { OrderResponseDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.html',
  styleUrls: ['./order-form.css']
})
export class OrderFormComponent implements OnInit {
  private machineService = inject(MachineService);
  private orderService = inject(ExecutionOrderService);

  maquinasDisponiveis: MachineDTO[] = [];
  ordens: OrderResponseDTO[] = [];
  
  novaOrdem = {
    numeroOrdem: '',
    quantidadeTotal: 1
  };
  
  nomeProdutoRef = '';
  maquinaSelecionada = '';
  ordemParaExcluir = '';
  ordemExclusaoPendente = '';
  isCarregando = false;
  mensagemFeedback = '';

  get ordensAguardando(): OrderResponseDTO[] {
    return this.ordens.filter((ordem) => ordem.status === 'AGUARDANDO' || !ordem.status);
  }

  get ordensSemMaquina(): OrderResponseDTO[] {
    return this.ordensAguardando.filter((ordem) => !ordem.subOrdens?.[0]?.maquinaIdealId);
  }

  quantidadeNaFilaDaMaquina(machineId: string): number {
    return this.ordensAguardando.filter((ordem) => ordem.subOrdens?.[0]?.maquinaIdealId === machineId).length;
  }

  textoResumoFila(): string {
    if (!this.maquinaSelecionada) {
      const total = this.ordensSemMaquina.length;
      return total === 1
        ? '1 OF aguardando definição de máquina.'
        : `${total} OFs aguardando definição de máquina.`;
    }

    const maquina = this.maquinasDisponiveis.find((item) => item.id === this.maquinaSelecionada);
    const total = this.quantidadeNaFilaDaMaquina(this.maquinaSelecionada);
    const nome = maquina?.nome || 'máquina selecionada';
    return total === 1
      ? `1 OF já está na fila de ${nome}.`
      : `${total} OFs já estão na fila de ${nome}.`;
  }

  get codigoOrdemNormalizado(): string {
    return this.normalizarTextoMaiusculo(this.novaOrdem.numeroOrdem);
  }

  get nomeProdutoNormalizado(): string {
    return this.normalizarTextoMaiusculo(this.nomeProdutoRef);
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
      !this.ordemJaExiste &&
      !this.isCarregando;
  }

  ngOnInit() {
    this.carregarMaquinas();
    this.carregarOrdens();
  }

  carregarMaquinas() {
    this.machineService.buscarTodasMaquinas().subscribe({
      next: (maquinas) => {
        this.maquinasDisponiveis = maquinas.filter(m => m.operacional);
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar máquinas disponíveis.');
      }
    });
  }

  carregarOrdens() {
    this.orderService.listarOrdens().subscribe({
      next: (dados) => {
        this.ordens = dados;
        if (this.ordemExclusaoPendente && !dados.some((ordem) => ordem.numeroOrdem === this.ordemExclusaoPendente)) {
          this.ordemExclusaoPendente = '';
        }
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar ordens de serviço.');
      }
    });
  }

  normalizarNumeroOrdemCampo() {
    this.novaOrdem.numeroOrdem = this.codigoOrdemNormalizado;
  }

  normalizarNomeProdutoCampo() {
    this.nomeProdutoRef = this.nomeProdutoNormalizado;
  }

  atualizarNumeroOrdemDigitado(valor: string) {
    this.novaOrdem.numeroOrdem = this.converterTextoMaiusculo(valor);
  }

  atualizarNomeProdutoDigitado(valor: string) {
    this.nomeProdutoRef = this.converterTextoMaiusculo(valor);
  }

  gerarOrdem() {
    const numeroOrdem = this.codigoOrdemNormalizado;
    const produtoNome = this.nomeProdutoNormalizado;
    const quantidadeTotal = Number(this.novaOrdem.quantidadeTotal);

    if (!numeroOrdem || !Number.isInteger(quantidadeTotal) || quantidadeTotal <= 0) {
      this.mensagemFeedback = 'Preencha o SKU do Produto e a Quantidade Solicitada.';
      return;
    }

    if (this.ordemJaExiste) {
      this.mensagemFeedback = 'Já existe uma ordem de serviço com esse código.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';

    const payload = {
      numeroOrdem,
      quantidadeTotal,
      produtoNome: produtoNome || undefined,
      maquinaIdealId: this.maquinaSelecionada ? this.maquinaSelecionada : null,
      subconjuntos: [{ letra: "A", quantidadeEtapas: 1 }]
    };

    this.orderService.criarOrdemComEtapas(payload).subscribe({
      next: () => {
        const destino = this.maquinaSelecionada
          ? ' A OF entrou na fila da máquina ideal selecionada.'
          : ' A OF ficou sem máquina definida e poderá ser alocada em Máquinas.';
        this.mensagemFeedback = `Ordem de Serviço gerada com sucesso.${destino}`;
        this.novaOrdem = { numeroOrdem: '', quantidadeTotal: 1 };
        this.nomeProdutoRef = '';
        this.maquinaSelecionada = '';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao gerar ordem de serviço.');
        this.isCarregando = false;
      }
    });
  }

  private normalizarTextoMaiusculo(valor: string): string {
    return this.converterTextoMaiusculo(valor).trim();
  }

  private converterTextoMaiusculo(valor: string): string {
    return (valor || '').toUpperCase();
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
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao excluir ordem. Ela pode estar em produção.');
        this.ordemExclusaoPendente = '';
        this.isCarregando = false;
      }
    });
  }
}
