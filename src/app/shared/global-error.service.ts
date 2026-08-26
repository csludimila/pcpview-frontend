import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorService {
  private readonly mensagemSubject = new BehaviorSubject<string>('');
  readonly mensagem$ = this.mensagemSubject.asObservable();

  mostrar(mensagem: string) {
    this.mensagemSubject.next(mensagem);
  }

  limpar() {
    this.mensagemSubject.next('');
  }
}
