import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importante para o formulário funcionar
import { ProductionService } from '../../services/production';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css'
})
export class OrderFormComponent {
  // Mantemos o seu objeto original
  novaOF = {
    ofPrincipal: '',
    quantidade: 0,
    produto: ''
  };

  constructor(private productionService: ProductionService) {}
 
  gerarProducao() {
    // 1. Validação (Garante que não envie vazio)
    if (!this.novaOF.ofPrincipal || this.novaOF.quantidade <= 0) {
      alert('Por favor, preencha a OF Principal e a Quantidade.');
      return;
    }

    console.log('Gerando ordens para:', this.novaOF);

    // 2. Chamada ao serviço usando os seus nomes
    this.productionService.gerarOrdens(this.novaOF).subscribe({
      next: (res) => {
        alert('Sucesso! As sub-ordens foram geradas.');
        this.limparFormulario(); // Chamamos a limpeza aqui
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao conectar com o servidor.');
      }
    });
  }

  // 3. Função de limpeza adaptada para o seu objeto novaOF
  limparFormulario() {
    this.novaOF = {
      ofPrincipal: '',
      quantidade: 0,
      produto: ''
    };
  }
}