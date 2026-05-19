import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { OpService } from '../../services/op'; 
import { MachineService } from '../../services/machine';
import { MachineModel } from '../../models/machine.model';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css'

  })
export class OrderFormComponent implements OnInit {
  novaOF = {
    numeroOrdem: '',
    quantidadeTotal: 1,
    maquinaId: '' 
  };

  listaDeMaquinas: MachineModel[] = [];

  constructor(
    private opService: OpService,
    private machineService: MachineService
  ) { }

  ngOnInit() {
    this.carregarMaquinas();
  }

  carregarMaquinas() {
    this.machineService.listAll().subscribe({
      next: (dados: MachineModel[]) => {
        this.listaDeMaquinas = dados;
      },
      error: (err: any) => console.error('Erro ao buscar máquinas', err)
    });
  }

  gerarProducao() {
    if (!this.novaOF.numeroOrdem || this.novaOF.quantidadeTotal <= 0) {
      alert('Por favor, preencha o número da OP e a quantidade.');
      return;
    }

    const ordemDTO = {
      numeroOrdem: this.novaOF.numeroOrdem,
      quantidadeTotal: this.novaOF.quantidadeTotal,
      subconjuntos: [
        {
          letra: 'A',
          quantidadeEtapas: this.novaOF.quantidadeTotal
        }
      ]
    };

    this.opService.cadastrar(ordemDTO).subscribe({
      next: (res: any) => {
        alert(`Sucesso! Ordem de Produção gerada com sucesso.`);
        this.limparFormulario();
      },
      error: (err: any) => {
        console.error('Erro ao gerar Ordem:', err);
        alert('Erro ao cadastrar. Verifique se o Backend está rodando.');
      }
    });
  }

  limparFormulario() {
    this.novaOF = { numeroOrdem: '', quantidadeTotal: 1, maquinaId: '' };
  }
}