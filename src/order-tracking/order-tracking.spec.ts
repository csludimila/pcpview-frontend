import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrderTrackingComponent } from './order-tracking';
import { ExecutionOrderService } from '../app/services/execution-order.service';

describe('OrderTrackingComponent', () => {
  let component: OrderTrackingComponent;
  let fixture: ComponentFixture<OrderTrackingComponent>;
  let executionOrderServiceSpy: jasmine.SpyObj<ExecutionOrderService>;

  beforeEach(async () => {
    executionOrderServiceSpy = jasmine.createSpyObj('ExecutionOrderService', [
      'listarOrdens',
      'listarTodas'
    ]);

    executionOrderServiceSpy.listarOrdens.and.returnValue(of([]));
    executionOrderServiceSpy.listarTodas.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [OrderTrackingComponent],
      providers: [
        { provide: ExecutionOrderService, useValue: executionOrderServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve mostrar maquina real, operador e status pausado da execucao ativa', () => {
    component.execucoesAbertas = [
      {
        id: 'exec-1',
        maquinaId: 'M-02',
        maquinaNome: 'MANDRILHADORA',
        subOrdemId: 'OF-100-A-01',
        operadorNome: 'operador@pcpview.local',
        status: 'PAUSADA_POR_QUEBRA'
      }
    ];

    const ordem = {
      numeroOrdem: 'OF-100',
      produtoNome: 'Eixo Guia',
      quantidadeTotal: 10,
      quantidadeProduzida: 3,
      status: 'EM_PROCESSAMENTO' as const,
      subOrdens: [
        {
          codigoEtapa: 'OF-100-A-01',
          quantidadeTotal: 10,
          quantidadeProduzida: 3,
          status: 'EM_PROCESSAMENTO' as const,
          maquinaIdealId: 'M-01',
          maquinaIdealNome: 'TORNO CNC',
          posicaoFila: 1
        }
      ]
    };

    expect(component.maquinaProducao(ordem)).toBe('MANDRILHADORA');
    expect(component.operadorProducao(ordem)).toBe('operador@pcpview.local');
    expect(component.textoStatusProducao(ordem)).toBe('PAUSADA');
    expect(component.classeStatusProducao(ordem)).toContain('status-pausado');
  });
});
