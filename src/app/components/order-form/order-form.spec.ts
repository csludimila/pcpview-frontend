import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrderFormComponent } from './order-form';
import { MachineService } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';

describe('OrderForm', () => {
  let component: OrderFormComponent;
  let fixture: ComponentFixture<OrderFormComponent>;
  let machineServiceSpy: jasmine.SpyObj<MachineService>;
  let executionOrderServiceSpy: jasmine.SpyObj<ExecutionOrderService>;

  beforeEach(async () => {
    machineServiceSpy = jasmine.createSpyObj('MachineService', ['buscarTodasMaquinas']);
    executionOrderServiceSpy = jasmine.createSpyObj('ExecutionOrderService', [
      'listarOrdens',
      'criarOrdemComEtapas',
      'excluirOrdem'
    ]);

    machineServiceSpy.buscarTodasMaquinas.and.returnValue(of([]));
    executionOrderServiceSpy.listarOrdens.and.returnValue(of([]));
    executionOrderServiceSpy.criarOrdemComEtapas.and.returnValue(of({
      numeroOrdem: 'OF-001',
      quantidadeTotal: 2,
      quantidadeProduzida: 0,
      status: 'AGUARDANDO'
    }));

    await TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        { provide: MachineService, useValue: machineServiceSpy },
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
    component.ordens = [{ numeroOrdem: 'OF-001', quantidadeTotal: 2, status: 'AGUARDANDO' }];
    component.novaOrdem = { numeroOrdem: 'OF-001', quantidadeTotal: 2 };

    expect(component.ordemJaExiste).toBeTrue();
    expect(component.podeGerarOrdem).toBeFalse();

    component.gerarOrdem();

    expect(executionOrderServiceSpy.criarOrdemComEtapas).not.toHaveBeenCalled();
    expect(component.mensagemFeedback).toBe('Já existe uma ordem de serviço com esse código.');
  });

  it('deve enviar maquina ideal opcional ao criar OF com textos padronizados em maiusculo', () => {
    component.novaOrdem = { numeroOrdem: 'pv-0011003', quantidadeTotal: 3 };
    component.nomeProdutoRef = 'eixo principal';
    component.maquinaSelecionada = 'MAQ-001';

    component.gerarOrdem();

    expect(executionOrderServiceSpy.criarOrdemComEtapas).toHaveBeenCalledWith({
      numeroOrdem: 'PV-0011003',
      quantidadeTotal: 3,
      produtoNome: 'EIXO PRINCIPAL',
      maquinaIdealId: 'MAQ-001',
      subconjuntos: [{ letra: 'A', quantidadeEtapas: 1 }]
    });
  });

  it('deve normalizar campos de texto ao sair do campo', () => {
    component.novaOrdem.numeroOrdem = ' pv-0011003 ';
    component.nomeProdutoRef = ' suporte lateral ';

    component.normalizarNumeroOrdemCampo();
    component.normalizarNomeProdutoCampo();

    expect(component.novaOrdem.numeroOrdem).toBe('PV-0011003');
    expect(component.nomeProdutoRef).toBe('SUPORTE LATERAL');
  });

  it('deve converter campos de texto para maiusculo durante a digitacao', () => {
    component.atualizarNumeroOrdemDigitado('pv-0011003');
    component.atualizarNomeProdutoDigitado('suporte lateral');

    expect(component.novaOrdem.numeroOrdem).toBe('PV-0011003');
    expect(component.nomeProdutoRef).toBe('SUPORTE LATERAL');
  });
});
