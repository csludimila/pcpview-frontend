import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrderFormComponent } from './order-form';
import { ExecutionOrderService } from '../../services/execution-order.service';

describe('OrderForm', () => {
  let component: OrderFormComponent;
  let fixture: ComponentFixture<OrderFormComponent>;
  let executionOrderServiceSpy: jasmine.SpyObj<ExecutionOrderService>;

  beforeEach(async () => {
    executionOrderServiceSpy = jasmine.createSpyObj('ExecutionOrderService', [
      'listarOrdens',
      'criarOrdemComEtapas',
      'excluirOrdem',
      'alterarQuantidadeOrdem',
      'alterarPrioridadeOrdem',
      'alterarStatusOrdem',
      'criarSubOrdem',
      'alterarStatusSubOrdem',
      'excluirSubOrdem'
    ]);

    executionOrderServiceSpy.listarOrdens.and.returnValue(of([]));
    executionOrderServiceSpy.criarOrdemComEtapas.and.returnValue(of({
      numeroOrdem: 'OF-001',
      quantidadeTotal: 2,
      quantidadeProduzida: 0,
      prioridade: 5,
      subOrdens: []
    }));
    executionOrderServiceSpy.alterarQuantidadeOrdem.and.returnValue(of({ numeroOrdem: 'OF-001', quantidadeTotal: 5 }));
    executionOrderServiceSpy.alterarPrioridadeOrdem.and.returnValue(of({ numeroOrdem: 'OF-001', prioridade: 1 }));
    executionOrderServiceSpy.alterarStatusOrdem.and.returnValue(of({ numeroOrdem: 'OF-001' }));
    executionOrderServiceSpy.criarSubOrdem.and.returnValue(of({ codigoEtapa: 'OF-001-A-02', quantidadeTotal: 2, quantidadeProduzida: 0 }));
    executionOrderServiceSpy.alterarStatusSubOrdem.and.returnValue(of({ codigoEtapa: 'OF-001-A-01', quantidadeTotal: 2, quantidadeProduzida: 0 }));
    executionOrderServiceSpy.excluirSubOrdem.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        { provide: ExecutionOrderService, useValue: executionOrderServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve bloquear geracao quando a OF ja existe', () => {
    component.ordens = [{ numeroOrdem: 'OF-001', quantidadeTotal: 2 }];
    component.novaOrdem = { numeroOrdem: 'OF-001', quantidadeTotal: 2 };

    expect(component.ordemJaExiste).toBeTrue();
    expect(component.podeGerarOrdem).toBeFalse();

    component.gerarOrdem();

    expect(executionOrderServiceSpy.criarOrdemComEtapas).not.toHaveBeenCalled();
    expect(component.mensagemFeedback).toBe('Já existe uma ordem de produção com esse código.');
  });

  it('deve enviar subconjuntos no formato do backend oficial', () => {
    component.novaOrdem = { numeroOrdem: 'of-001', quantidadeTotal: 3 };
    component.subconjuntos = [
      { letra: 'a', quantidadeEtapas: 2 },
      { letra: 'b', quantidadeEtapas: 1 }
    ];

    component.gerarOrdem();

    expect(executionOrderServiceSpy.criarOrdemComEtapas).toHaveBeenCalledWith({
      numeroOrdem: 'OF-001',
      quantidadeTotal: 3,
      subconjuntos: [
        { letra: 'A', quantidadeEtapas: 2 },
        { letra: 'B', quantidadeEtapas: 1 }
      ]
    });
  });

  it('deve normalizar numero da ordem durante a digitacao', () => {
    component.atualizarNumeroOrdemDigitado('of-123');
    component.normalizarNumeroOrdemCampo();

    expect(component.novaOrdem.numeroOrdem).toBe('OF-123');
  });

  it('deve chamar endpoints administrativos de ordem', () => {
    const ordem = { numeroOrdem: 'OF-001', quantidadeTotal: 2, prioridade: 5 };

    component.quantidadeEdicao['OF-001'] = 8;
    component.prioridadeEdicao['OF-001'] = 1;
    component.statusOrdemEdicao['OF-001'] = 'FINALIZADO';

    component.alterarQuantidade(ordem);
    component.alterarPrioridade(ordem);
    component.alterarStatusOrdem(ordem);

    expect(executionOrderServiceSpy.alterarQuantidadeOrdem).toHaveBeenCalledWith('OF-001', 8);
    expect(executionOrderServiceSpy.alterarPrioridadeOrdem).toHaveBeenCalledWith('OF-001', 1);
    expect(executionOrderServiceSpy.alterarStatusOrdem).toHaveBeenCalledWith('OF-001', 'FINALIZADO');
  });

  it('deve criar e alterar status de subordem', () => {
    component.letraNovaSubOrdem['OF-001'] = 'c';
    component.criarNovaSubOrdem({ numeroOrdem: 'OF-001' });

    component.statusSubOrdemEdicao['OF-001-A-01'] = 'CANCELADO';
    component.alterarStatusSubOrdem({ codigoEtapa: 'OF-001-A-01', quantidadeTotal: 2, quantidadeProduzida: 0 });

    expect(executionOrderServiceSpy.criarSubOrdem).toHaveBeenCalledWith('OF-001', 'C');
    expect(executionOrderServiceSpy.alterarStatusSubOrdem).toHaveBeenCalledWith('OF-001-A-01', 'CANCELADO');
  });
});
