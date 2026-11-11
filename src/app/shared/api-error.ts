import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      if (environment.production) {
        return 'Servidor indisponível. Verifique se a API publicada está online.';
      }

      return `Servidor indisponível. Confirme se a API está acessível em ${environment.apiUrl}.`;
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      const mensagem = error.error.trim();
      return mensagemTecnica(mensagem) ? fallback : mensagem;
    }

    if (error.error?.message) {
      const mensagem = String(error.error.message).trim();
      return mensagemTecnica(mensagem) ? fallback : mensagem;
    }
  }

  return fallback;
}

function mensagemTecnica(mensagem: string): boolean {
  return /erro inesperado:|validation failed|org\.springframework|jakarta\.validation|exception/i.test(mensagem);
}
