import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OpFormComponent } from './op-form';
import { MachineService } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { MachineResponseDTO } from '../../models/api.models';

describe('OpFormComponent', () => {
  let component: OpFormComponent;
  let fixture: ComponentFixture<OpFormComponent>;
  let machineServiceSpy: jasmine.SpyObj<MachineService>;
  let executionOrderServiceSpy: jasmine.SpyObj<ExecutionOrderService>;

  beforeEach(async () => {
    machineServiceSpy = jasmine.createSpyObj('MachineService', ['buscarTodasMaquinas', 'enviarParaManutencao']);
    executionOrderServiceSpy = jasmine.createSpyObj('ExecutionOrderService', [
      'listarOrdens',
      'listarTodas',
      'iniciar',
      'pausar',
      'retomar',
      'finalizarSetup',
      'finalizar'
    ]);

    machineServiceSpy.buscarTodasMaquinas.and.returnValue(of([]));
    machineServiceSpy.enviarParaManutencao.and.returnValue(of({ id: 'M-01', nome: 'Maquina 01', operacional: false, statusOperacional: 'MANUTENCAO' }));
    executionOrderServiceSpy.listarOrdens.and.returnValue(of([]));
    executionOrderServiceSpy.listarTodas.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [OpFormComponent],
      providers: [
        { provide: MachineService, useValue: machineServiceSpy },
        { provide: ExecutionOrderService, useValue: executionOrderServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve liberar inicio somente com maquina disponivel e formulario valido', () => {
    const maquinaDisponivel: MachineResponseDTO = {
      id: 'M-01',
      nome: 'Maquina 01',
      operacional: true,
      statusOperacional: 'DISPONIVEL'
    };
    component.listaDeMaquinas = [maquinaDisponivel];
    component.opForm.patchValue({
      idMaquina: 'M-01',
      idEtapaSubOrdem: 'OF-001-A-01',
      quantidadeProduzida: 1,
      setupPrimeiraPeca: false
    });
    component.maquinaSelecionada = maquinaDisponivel;

    expect(component.podeIniciar).toBeTrue();

    component.execucaoAtual = {
      id: 'exec-1',
      status: 'RODANDO'
    };

    expect(component.podeIniciar).toBeFalse();
  });

  it('deve expor acoes corretas quando execucao esta rodando', () => {
    component.execucaoAtual = {
      id: 'exec-1',
      status: 'RODANDO',
      setupPrimeiraPeca: true
    };

    expect(component.podePausar).toBeTrue();
    expect(component.podeRetomar).toBeFalse();
    expect(component.podeFinalizarSetup).toBeTrue();
    expect(component.podeFinalizar).toBeTrue();
  });

  it('deve permitir finalizar durante pausa por quebra sem liberar setup', () => {
    component.execucaoAtual = {
      id: 'exec-1',
      status: 'PAUSADA_POR_QUEBRA',
      setupPrimeiraPeca: true
    };

    expect(component.podePausar).toBeFalse();
    expect(component.podeRetomar).toBeTrue();
    expect(component.podeFinalizarSetup).toBeFalse();
    expect(component.podeFinalizar).toBeTrue();
  });

  it('deve mostrar lote e produto separadamente na IHM', () => {
    executionOrderServiceSpy.listarOrdens.and.returnValue(of([
      {
        numeroOrdem: 'OF-100',
        produtoNome: 'Eixo Guia',
        quantidadeTotal: 4,
        quantidadeProduzida: 0,
        status: 'AGUARDANDO',
        subOrdens: [
          {
            codigoEtapa: 'OF-100-A-01',
            quantidadeTotal: 4,
            quantidadeProduzida: 0,
            status: 'AGUARDANDO'
          }
        ]
      }
    ]));

    component.carregarOrdensPlanejadas();
    component.opForm.patchValue({ idEtapaSubOrdem: 'OF-100-A-01' });

    expect(component.loteSelecionado).toBe('OF-100-A-01');
    expect(component.produtoSelecionado).toBe('Eixo Guia');
  });

  it('deve mostrar a posicao atual da fila na IHM mesmo quando existem lacunas', () => {
    component.opForm.patchValue({ idMaquina: 'M-01' });
    component.listaDeOrdens = [
      {
        codigoEtapa: 'OF-200-A-01',
        ordemNumero: 'OF-200',
        quantidadeTotal: 5,
        quantidadeProduzida: 0,
        status: 'AGUARDANDO',
        maquinaIdealId: 'M-01',
        posicaoFila: 2
      }
    ];

    expect(component.textoOpcaoOrdem(component.listaDeOrdens[0])).toContain('Próxima | OF-200-A-01');
    expect(component.textoOpcaoOrdem(component.listaDeOrdens[0])).toContain('Fila 1');
  });

  it('deve selecionar execucao ativa da maquina para permitir encerrar a peca', () => {
    const maquinaTrabalhando: MachineResponseDTO = {
      id: 'M-01',
      nome: 'Maquina 01',
      operacional: true,
      statusOperacional: 'TRABALHANDO'
    };
    component.listaDeMaquinas = [maquinaTrabalhando];
    component.listaDeExecucoes = [
      {
        id: 'exec-ativa',
        maquinaId: 'M-01',
        maquinaNome: 'Maquina 01',
        subOrdemId: 'OF-300-A-01',
        operadorNome: 'OPERADOR TESTE',
        status: 'RODANDO'
      }
    ];

    component.opForm.patchValue({ idMaquina: 'M-01', quantidadeProduzida: 1 });

    expect(component.execucaoAtual?.id).toBe('exec-ativa');
    expect(component.opForm.controls.idEtapaSubOrdem.value).toBe('OF-300-A-01');
    expect(component.podeFinalizar).toBeTrue();
  });

  it('deve mostrar saldo pela execucao ativa quando a subordem ainda nao carregou', () => {
    component.execucaoAtual = {
      id: 'exec-ativa',
      maquinaId: 'M-01',
      subOrdemId: 'OF-400-A-01',
      status: 'RODANDO',
      quantidadeTotal: 8,
      quantidadeProduzida: 3,
      quantidadeRestante: 5
    };
    component.listaDeOrdens = [];

    expect(component.saldoSelecionado).toBe('3 / 8 PEÇAS');
  });
});
