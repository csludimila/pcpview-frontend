import { ErrorHandler, Injectable, inject } from '@angular/core';
import { GlobalErrorService } from './global-error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly globalErrorService = inject(GlobalErrorService);

  handleError(error: unknown): void {
    this.globalErrorService.mostrar('Tivemos um problema inesperado. Tente novamente.');
    console.error(error);
  }
}
