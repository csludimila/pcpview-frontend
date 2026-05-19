import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MachineService } from '../../services/machine';
import { OpService } from '../../services/op';
import { MachineModel } from '../../models/machine.model';

@Component({
  selector: 'app-op-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './op-form.html',
  styleUrls: ['./op-form.css']
})
export class OpFormComponent implements OnInit {

  listaDeMaquinas: MachineModel[] = [];

  // 1. CORREÇÃO: Transformamos em array vazio para receber os dados dinâmicos do banco
  listaDeOrdens: any[] = [];

  opForm = new FormGroup({
    idMaquina: new FormControl('', Validators.required),
    // 2. IMPORTANTE: Garantir que a propriedade bate exatamente com o nome esperado pelo controle do HTML e pelo Swagger
    idEtapaSubordem: new FormControl('', Validators.required)
  });

  constructor(
    private machineService: MachineService,
    private opService: OpService
  ) { }

  ngOnInit() {
    this.carregarMaquinas();
    this.carregarOrdensPlanejadas(); // 3. Chamando a nova função ao iniciar a tela
  }

  carregarMaquinas() {
    this.machineService.listAll().subscribe({
      next: (dados: MachineModel[]) => {
        this.listaDeMaquinas = dados;
      },
      error: (err: any) => console.error('Erro ao carregar máquinas:', err)
    });
  }

  // 4. NOVA FUNÇÃO: Busca as ordens/etapas que foram geradas de verdade pelo escritório
  carregarOrdensPlanejadas() {
    // CORREÇÃO: Mudamos de 'listarExecucoes()' para 'buscarExecucoes()'
    this.opService.buscarExecucoes().subscribe({
      next: (dados: any[]) => {
        this.listaDeOrdens = dados;
      },
      error: (err: any) => console.error('Erro ao carregar ordens do banco:', err)
    });
  }

  onIniciar() {
    if (this.opForm.valid) {
      console.log('Iniciando com os dados reais:', this.opForm.value);

      this.opService.iniciarExecucao(this.opForm.value).subscribe({
        next: (res: any) => {
          alert(`Sucesso! Produção iniciada. Status atual: ${res.status}`);
        },
        error: (err: any) => {
          console.error(err);
          alert('Erro ao iniciar execução no servidor. Verifique os IDs enviados.');
        }
      });
    } else {
      alert('Selecione a Máquina e a Ordem antes de iniciar a produção!');
    }
  }

  onPausar() {
    alert('Ação de Pausa acionada (Simulado)');
  }

  // Aciona o endpoint: PUT /execucoes/finalizar
  onFinalizar() {
    // 1. Pegamos o ID da execução/lote selecionado no formulário
    const idExecucao = this.opForm.get('idEtapaSubOrdem')?.value;

    if (!idExecucao) {
      alert('Selecione uma ordem em execução para poder finalizar!');
      return;
    }

    // 2. Abre uma caixinha no navegador perguntando a quantidade produzida
    const qtdDigitada = prompt('Digite a quantidade de peças produzidas com sucesso:');

    // Valida se o usuário digitou um número válido
    if (qtdDigitada === null || qtdDigitada.trim() === '' || isNaN(Number(qtdDigitada))) {
      alert('Quantidade inválida. Operação cancelada.');
      return;
    }

    const quantidadeTotal = Number(qtdDigitada);

    // 3. Dispara a requisição para o endpoint PUT do seu OpService
    this.opService.finalizarExecucao(idExecucao, quantidadeTotal).subscribe({
      next: (res: any) => {
        alert(`Produção finalizada com sucesso! Quantidade registrada: ${quantidadeTotal}`);
        this.carregarOrdensPlanejadas(); // Atualiza a lista na tela
      },
      error: (err: any) => {
        console.error(err);
        alert('Erro ao finalizar a execução no servidor.');
      }
    });
  }

  onManutencao() {
    alert('Ação de Manutenção acionada (Simulado)');
  }
}