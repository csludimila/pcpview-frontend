import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachineService, MachineDTO } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { OrderResponseDTO } from '../../models/api.models';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.html'
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
    return this.novaOrdem.numeroOrdem.trim();
  }

  get ordemJaExiste(): boolean {
    const codigo = this.codigoOrdemNormalizado.toLowerCase();
    return !!codigo && this.ordens.some((ordem) => (ordem.numeroOrdem || '').toLowerCase() === codigo);
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
        console.error('Erro ao buscar máquinas', err);
        this.mensagemFeedback = 'Erro ao carregar máquinas disponíveis.';
      }
    });
  }

  carregarOrdens() {
    this.orderService.listarOrdens().subscribe({
      next: (dados) => this.ordens = dados,
      error: (err) => {
        console.error('Erro ao buscar ordens', err);
        this.mensagemFeedback = 'Erro ao carregar ordens de serviço.';
      }
    });
  }

  gerarOrdem() {
    const numeroOrdem = this.codigoOrdemNormalizado;
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
      produtoNome: this.nomeProdutoRef.trim() || undefined,
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
        console.error('Erro ao gerar ordem', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao gerar ordem de serviço.';
        this.isCarregando = false;
      }
    });
  }

  excluirOrdem() {
    if (!this.ordemParaExcluir) return;
    if (!confirm('Tem a certeza que deseja excluir esta ordem permanentemente?')) return;

    this.isCarregando = true;
    this.mensagemFeedback = '';
    this.orderService.excluirOrdem(this.ordemParaExcluir).subscribe({
      next: () => {
        this.mensagemFeedback = 'Ordem excluída com sucesso.';
        this.ordemParaExcluir = '';
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        console.error('Erro ao excluir ordem', err);
        this.mensagemFeedback = err.error?.message || 'Erro ao excluir ordem. Ela pode estar em produção.';
        this.isCarregando = false;
      }
    });
  }
}
