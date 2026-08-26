import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      if (environment.production) {
        return 'Servidor indisponível. Verifique se a API publicada está online.';
      }

      return 'Servidor indisponível. Inicie o ambiente local e confirme o backend em http://localhost:8080/health.';
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }

    if (error.error?.message) {
      return error.error.message;
    }
  }

  return fallback;
}
