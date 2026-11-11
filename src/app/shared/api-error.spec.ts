import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('mantem mensagens amigaveis retornadas pela API', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: 'E-mail ou senha inválidos.'
    });

    expect(apiErrorMessage(error, 'Falha ao entrar.')).toBe('E-mail ou senha inválidos.');
  });

  it('oculta detalhes tecnicos de validacao do backend', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: 'Erro inesperado: Validation failed for argument [0] in org.springframework.Controller'
    });

    expect(apiErrorMessage(error, 'Não foi possível concluir a operação.'))
      .toBe('Não foi possível concluir a operação.');
  });
});
