import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachineService, MachineDTO } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { OrderRequestDTO, OrderResponseDTO, ProcessStepRequestDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';

interface RoteiroEtapaUI extends ProcessStepRequestDTO {
  ativa: boolean;
  sigla: string;
}

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
  roteiroEtapas: RoteiroEtapaUI[] = this.criarRoteiroPadrao();
  ordemParaExcluir = '';
  ordemExclusaoPendente = '';
  isCarregando = false;
  mensagemFeedback = '';

  get ordensAguardando(): OrderResponseDTO[] {
    return this.ordens.filter((ordem) => ordem.status === 'AGUARDANDO' || !ordem.status);
  }

  get quantidadeEtapasAtivas(): number {
    return this.roteiroEtapas.filter((etapa) => etapa.ativa).length;
  }

  get etapasSemCentro(): number {
    return this.ordensAguardando.flatMap((ordem) => ordem.subOrdens || [])
      .filter((subOrdem) => (subOrdem.quantidadeProduzida || 0) < (subOrdem.quantidadeTotal || 0))
      .filter((subOrdem) => subOrdem.status === 'AGUARDANDO' || !subOrdem.status)
      .filter((subOrdem) => !subOrdem.maquinaIdealId)
      .length;
  }

  quantidadeNaFilaDaMaquina(machineId: string): number {
    return this.ordensAguardando.flatMap((ordem) => ordem.subOrdens || [])
      .filter((subOrdem) => (subOrdem.quantidadeProduzida || 0) < (subOrdem.quantidadeTotal || 0))
      .filter((subOrdem) => subOrdem.status === 'AGUARDANDO' || !subOrdem.status)
      .filter((subOrdem) => subOrdem.maquinaIdealId === machineId)
      .length;
  }

  maquinasPorSetor(setor: string): MachineDTO[] {
    return this.maquinasDisponiveis
      .filter((maquina) => this.normalizarTextoMaiusculo(maquina.setor || 'USINAGEM') === setor)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }

  textoResumoEtapa(etapa: RoteiroEtapaUI): string {
    if (!etapa.ativa) return 'Etapa fora do roteiro desta OF.';
    if (!etapa.maquinaIdealId) return 'Sem centro definido. A etapa entrará para alocação manual.';

    const maquina = this.maquinasDisponiveis.find((item) => item.id === etapa.maquinaIdealId);
    const total = this.quantidadeNaFilaDaMaquina(etapa.maquinaIdealId);
    const nome = maquina?.nome || 'centro selecionado';
    return total === 1
      ? `1 etapa já está na fila de ${nome}.`
      : `${total} etapas já estão na fila de ${nome}.`;
  }

  get textoResumoRoteiro(): string {
    if (this.quantidadeEtapasAtivas === 0) return 'Selecione pelo menos uma etapa do processo.';
    const primeira = this.roteiroEtapas.find((etapa) => etapa.ativa);
    return `${this.quantidadeEtapasAtivas} etapas no roteiro. Primeira liberação: ${primeira?.nomeEtapa || '-'}.`;
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
      this.quantidadeEtapasAtivas > 0 &&
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
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar centros disponíveis.');
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
    const roteiroEtapas = this.montarRoteiroPayload();

    if (!numeroOrdem || !Number.isInteger(quantidadeTotal) || quantidadeTotal <= 0) {
      this.mensagemFeedback = 'Preencha o SKU do Produto e a Quantidade Solicitada.';
      return;
    }

    if (roteiroEtapas.length === 0) {
      this.mensagemFeedback = 'Selecione pelo menos uma etapa do roteiro.';
      return;
    }

    if (this.ordemJaExiste) {
      this.mensagemFeedback = 'Já existe uma ordem de serviço com esse código.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';

    const payload: OrderRequestDTO = {
      numeroOrdem,
      quantidadeTotal,
      produtoNome: produtoNome || undefined,
      roteiroEtapas
    };

    this.orderService.criarOrdemComEtapas(payload).subscribe({
      next: () => {
        this.mensagemFeedback = `Ordem de Serviço gerada com sucesso. ${this.textoResumoRoteiro}`;
        this.novaOrdem = { numeroOrdem: '', quantidadeTotal: 1 };
        this.nomeProdutoRef = '';
        this.roteiroEtapas = this.criarRoteiroPadrao();
        this.carregarOrdens();
        this.isCarregando = false;
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao gerar ordem de serviço.');
        this.isCarregando = false;
      }
    });
  }

  trackEtapa(_: number, etapa: RoteiroEtapaUI): string {
    return etapa.setor;
  }

  private montarRoteiroPayload(): ProcessStepRequestDTO[] {
    return this.roteiroEtapas
      .filter((etapa) => etapa.ativa)
      .map((etapa) => ({
        nomeEtapa: etapa.nomeEtapa,
        setor: etapa.setor,
        maquinaIdealId: etapa.maquinaIdealId || null
      }));
  }

  private criarRoteiroPadrao(): RoteiroEtapaUI[] {
    return [
      { sigla: 'CT', nomeEtapa: 'CORTE', setor: 'CORTE', maquinaIdealId: null, ativa: true },
      { sigla: 'CL', nomeEtapa: 'CALDEIRARIA', setor: 'CALDEIRARIA', maquinaIdealId: null, ativa: true },
      { sigla: 'US', nomeEtapa: 'USINAGEM', setor: 'USINAGEM', maquinaIdealId: null, ativa: true },
      { sigla: 'AC', nomeEtapa: 'ACABAMENTO', setor: 'ACABAMENTO', maquinaIdealId: null, ativa: true },
      { sigla: 'IN', nomeEtapa: 'INSPECAO', setor: 'INSPECAO', maquinaIdealId: null, ativa: true },
      { sigla: 'EX', nomeEtapa: 'EXPEDICAO', setor: 'EXPEDICAO', maquinaIdealId: null, ativa: true }
    ];
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
