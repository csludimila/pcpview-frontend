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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve classificar ordem em producao quando existe execucao rodando', () => {
    component.execucoes = [
      {
        id: 'exec-1',
        maquinaNome: 'MANDRILHADORA',
        subOrdemId: 'OF-100-A-01',
        operadorNome: 'operador@pcpview.local',
        status: 'RODANDO'
      }
    ];

    const ordem = {
      numeroOrdem: 'OF-100',
      quantidadeTotal: 10,
      quantidadeProduzida: 3,
      prioridade: 2,
      subOrdens: [
        {
          codigoEtapa: 'OF-100-A-01',
          quantidadeTotal: 10,
          quantidadeProduzida: 3
        }
      ]
    };

    expect(component.execucaoAtivaDaOrdem(ordem)?.maquinaNome).toBe('MANDRILHADORA');
    expect(component.textoStatusOrdem(ordem)).toBe('EM PRODUÇÃO');
    expect(component.classeStatusOrdem(ordem)).toContain('status-producao');
  });

  it('deve classificar ordem finalizada pela quantidade produzida', () => {
    const ordem = {
      numeroOrdem: 'OF-200',
      quantidadeTotal: 5,
      quantidadeProduzida: 5,
      prioridade: 1,
      subOrdens: [
        {
          codigoEtapa: 'OF-200-A-01',
          quantidadeTotal: 5,
          quantidadeProduzida: 5
        }
      ]
    };

    expect(component.textoStatusOrdem(ordem)).toBe('FINALIZADA');
    expect(component.progressoOrdem(ordem)).toBe(100);
  });
});
