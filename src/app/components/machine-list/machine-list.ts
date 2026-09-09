import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { MachineService, MachineDTO } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { ExecutionResponseDTO } from '../../models/api.models';
import { apiErrorMessage } from '../../shared/api-error';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machine-list.html',
  styleUrls: ['./machine-list.css']
})
export class MachineListComponent implements OnInit {
  private machineService = inject(MachineService);
  private executionOrderService = inject(ExecutionOrderService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  maquinas: MachineDTO[] = [];
  execucoesAbertas: ExecutionResponseDTO[] = [];
  isCarregando = false;
  mensagemFeedback = '';

  novaMaquinaId = '';
  novaMaquinaNome = '';
  buscaMaquinaId = '';
  maquinaEncontrada?: MachineDTO;
  maquinaExclusaoPendente = '';
  maquinaEdicaoId = '';
  nomeMaquinaEditado = '';

  ngOnInit() {
    this.carregarMaquinas();
    this.carregarExecucoes();
    interval(8000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sincronizarPainel());
  }

  sincronizarPainel() {
    this.carregarMaquinas(true);
    this.carregarExecucoes();
  }

  carregarMaquinas(silencioso = false) {
    if (!silencioso) {
      this.isCarregando = true;
    }

    this.machineService.buscarTodasMaquinas().subscribe({
      next: (dados) => {
        this.maquinas = dados.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        if (this.maquinaExclusaoPendente && !dados.some((maquina) => maquina.id === this.maquinaExclusaoPendente)) {
          this.maquinaExclusaoPendente = '';
        }
        if (this.maquinaEdicaoId && !dados.some((maquina) => maquina.id === this.maquinaEdicaoId)) {
          this.cancelarEdicaoMaquina();
        }
        if (!silencioso) {
          this.isCarregando = false;
        }
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar máquinas.');
        if (!silencioso) {
          this.isCarregando = false;
        }
      }
    });
  }

  carregarExecucoes() {
    this.executionOrderService.listarTodas({ status: 'RODANDO' }).subscribe({
      next: (execucoes) => {
        this.execucoesAbertas = execucoes.filter((execucao) => execucao.status === 'RODANDO');
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao carregar execuções em andamento.');
      }
    });
  }

  buscarMaquinaPorId() {
    const id = this.normalizarTextoMaiusculo(this.buscaMaquinaId);
    if (!id) {
      this.maquinaEncontrada = undefined;
      this.mensagemFeedback = 'Informe o ID da máquina para buscar.';
      return;
    }

    this.isCarregando = true;
    this.machineService.buscarMaquinaPorId(id).subscribe({
      next: (maquina) => {
        this.maquinaEncontrada = maquina;
        this.mensagemFeedback = 'Máquina encontrada.';
        this.isCarregando = false;
      },
      error: (err) => {
        this.maquinaEncontrada = undefined;
        this.mensagemFeedback = apiErrorMessage(err, 'Máquina não encontrada.');
        this.isCarregando = false;
      }
    });
  }

  adicionarMaquina() {
    const id = this.normalizarTextoMaiusculo(this.novaMaquinaId);
    const nome = this.normalizarTextoMaiusculo(this.novaMaquinaNome);
    if (!id || !nome) {
      this.mensagemFeedback = 'Informe ID e nome para cadastrar a máquina.';
      return;
    }

    this.isCarregando = true;
    this.machineService.registrarMaquina({ id, nome }).subscribe({
      next: () => {
        this.novaMaquinaId = '';
        this.novaMaquinaNome = '';
        this.mensagemFeedback = 'Máquina cadastrada com sucesso.';
        this.carregarMaquinas();
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao cadastrar máquina.');
        this.isCarregando = false;
      }
    });
  }

  excluirMaquina(id: string) {
    if (this.maquinaExclusaoPendente !== id) {
      this.maquinaExclusaoPendente = id;
      this.cancelarEdicaoMaquina();
      this.mensagemFeedback = 'Clique novamente em excluir para confirmar a remoção da máquina.';
      return;
    }

    this.isCarregando = true;
    this.mensagemFeedback = '';
    this.machineService.deletarMaquina(id).subscribe({
      next: () => {
        this.maquinaExclusaoPendente = '';
        this.mensagemFeedback = 'Máquina excluída com sucesso.';
        this.carregarMaquinas();
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao excluir máquina.');
        this.maquinaExclusaoPendente = '';
        this.isCarregando = false;
      }
    });
  }

  alternarStatus(id: string) {
    this.isCarregando = true;
    this.machineService.alternarStatusOperacional(id).subscribe({
      next: () => {
        this.mensagemFeedback = 'Status operacional atualizado.';
        this.carregarMaquinas();
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao alternar status da máquina.');
        this.isCarregando = false;
      }
    });
  }

  iniciarEdicaoMaquina(maquina: MachineDTO) {
    if (!maquina.id) return;

    this.maquinaEdicaoId = maquina.id;
    this.nomeMaquinaEditado = maquina.nome || '';
    this.maquinaExclusaoPendente = '';
    this.mensagemFeedback = '';
  }

  cancelarEdicaoMaquina() {
    this.maquinaEdicaoId = '';
    this.nomeMaquinaEditado = '';
  }

  salvarNomeMaquina(maquina: MachineDTO) {
    const id = maquina.id;
    const nome = this.normalizarTextoMaiusculo(this.nomeMaquinaEditado);

    if (!id || !nome) {
      this.mensagemFeedback = 'Informe um nome válido para a máquina.';
      return;
    }

    if (nome === this.normalizarTextoMaiusculo(maquina.nome || '')) {
      this.cancelarEdicaoMaquina();
      return;
    }

    this.isCarregando = true;
    this.machineService.alterarNome(id, { nome }).subscribe({
      next: () => {
        this.mensagemFeedback = 'Nome da máquina atualizado com sucesso.';
        this.cancelarEdicaoMaquina();
        this.carregarMaquinas();
      },
      error: (err) => {
        this.mensagemFeedback = apiErrorMessage(err, 'Erro ao atualizar nome da máquina.');
        this.isCarregando = false;
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  textoQuantidade(total: number): string {
    return total === 1 ? '1 máquina' : `${total} máquinas`;
  }

  textoStatusMaquina(maq: MachineDTO): string {
    return maq.operacional === false ? 'INDISPONÍVEL' : 'OPERACIONAL';
  }

  classeStatusMaquina(maq: MachineDTO): string {
    return maq.operacional === false ? 'dot-red' : 'dot-green';
  }

  execucaoAtivaDaMaquina(maq: MachineDTO): ExecutionResponseDTO | undefined {
    return this.execucoesAbertas.find((execucao) =>
      execucao.maquinaId === maq.id ||
      this.normalizarTextoMaiusculo(execucao.maquinaNome || '') === this.normalizarTextoMaiusculo(maq.nome || '')
    );
  }

  trackMaquina(_: number, maquina: MachineDTO): string {
    return maquina.id;
  }

  private normalizarTextoMaiusculo(valor: string): string {
    return (valor || '').trim().toUpperCase();
  }
}
