import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms'; // Ferramentas de formulário
import { OpService } from '../../services/op'; // Importa o serviço que criamos

@Component({
  selector: 'app-op-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Avisamos ao Angular que vamos usar formulários aqui
  templateUrl: './op-form.html',
  styleUrls: ['./op-form.css']
})
export class OpFormComponent {
  // Criamos o grupo de campos (o molde do formulário)
  opForm = new FormGroup({
    pv: new FormControl('', Validators.required),
    operador: new FormControl('', Validators.required),
    maquina: new FormControl(''),
    dataInclusao: new FormControl(''),
    dataEntrega: new FormControl(''),
    status: new FormControl('Aguardando'),
    observacoes: new FormControl('')
  });

  constructor(private opService: OpService) {}

  // Função que o botão de salvar vai chamar
  onSubmit() {
    if (this.opForm.valid) {
      console.log('Dados do formulário:', this.opForm.value);
      
      // Aqui chamamos o serviço para enviar ao Java
      this.opService.criarOrdem(this.opForm.value).subscribe({
        next: (res) => alert('Ordem de Produção salva com sucesso!'),
        error: (err) => alert('Erro ao salvar. Verifique se o Back-end está ligado.')
      });
    } else {
      alert('Por favor, preencha os campos obrigatórios!');
    }
  }
}