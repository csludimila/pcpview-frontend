import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { MachineService } from '../../services/machine';
import { ProductionService } from '../../services/production'; 
import { MachineModel } from '../../models/machine.model';
import { ProductOrderModel } from '../../models/ordem-producao'; 

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './machine-list.html',
  styleUrl: './machine-list.css'
})
export class MachineListComponent implements OnInit {
  machines: MachineModel[] = [];
  orders: ProductOrderModel[] = []; 
  novaMaquinaNome: string = '';    
  maquinaParaIniciar?: MachineModel; 

  constructor(
    private machineService: MachineService,
    private productionService: ProductionService 
  ) {}

  ngOnInit(): void {
    this.carregarMaquinas();
    this.carregarOrdens(); 
    
    setInterval(() => {
      this.carregarOrdens();
      console.log('Fila de produção atualizada automaticamente.');
   }, 30000);

  }
  carregarMaquinas() {
    this.machineService.listAll().subscribe(dados => {
      this.machines = dados;
    });
  }

  carregarOrdens() {
    this.productionService.listarTodas().subscribe(dados => {
      this.orders = dados;
    });
  }
  
  alterarStatus(id: number) {
    this.machineService.toggleStatus(id).subscribe(() => {
      this.carregarMaquinas();
    });
  }

 alterarNome(id: number) {
    const novoNome = prompt("Digite o novo nome para esta máquina:");
    
    if (novoNome && novoNome.trim() !== '') {
      this.machineService.updateName(id, novoNome).subscribe({
        next: () => {
          alert("Nome atualizado com sucesso!");
          this.carregarMaquinas();
        },
        error: (err) => {
          console.error(err);
          alert("Erro ao conectar com o servidor.");
        }
      });
    }
  } 

  abrirSelecaoOF(maquina: MachineModel) {
    this.maquinaParaIniciar = maquina;
  }

  vincularOrdem(ordem: ProductOrderModel) {
    if (this.maquinaParaIniciar && this.maquinaParaIniciar.id) {
      this.machineService.toggleStatus(this.maquinaParaIniciar.id).subscribe(() => {
        alert(`Sucesso! A máquina ${this.maquinaParaIniciar?.nome} agora está produzindo a OF ${ordem.ofGerada}`);
        this.carregarMaquinas();
        this.carregarOrdens();
      });
    }
  }
  

  abrirApontamento(maquina: MachineModel) {
    console.log('Apontando peças para a máquina:', maquina.nome);
  }

  deletar(id: number) {
    if(confirm("Deseja realmente excluir esta máquina?")) {
      this.machineService.delete(id).subscribe(() => {
        this.carregarMaquinas();
      });
    }
  }
}