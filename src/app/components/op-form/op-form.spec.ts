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
    machineServiceSpy = jasmine.createSpyObj('MachineService', ['buscarTodasMaquinas']);
    executionOrderServiceSpy = jasmine.createSpyObj('ExecutionOrderService', [
      'listarOrdens',
      'listarTodas',
      'iniciar',
      'finalizar',
      'cancelar'
    ]);

    machineServiceSpy.buscarTodasMaquinas.and.returnValue(of([]));
    executionOrderServiceSpy.listarOrdens.and.returnValue(of([]));
    executionOrderServiceSpy.listarTodas.and.returnValue(of([]));
    executionOrderServiceSpy.iniciar.and.returnValue(of({
      id: 'exec-1',
      maquinaNome: 'MAQUINA 01',
      subOrdemId: 'OF-001-A-01',
      operadorNome: 'operador@pcpview.local',
      status: 'RODANDO'
    }));
    executionOrderServiceSpy.finalizar.and.returnValue(of({ id: 'exec-1', status: 'FINALIZADA' }));
    executionOrderServiceSpy.cancelar.and.returnValue(of(void 0));

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

  it('deve liberar inicio com maquina operacional e etapa selecionada', () => {
    const maquinaDisponivel: MachineResponseDTO = {
      id: 'M-01',
      nome: 'MAQUINA 01',
      operacional: true
    };
    component.listaDeMaquinas = [maquinaDisponivel];
    component.opForm.patchValue({
      idMaquina: 'M-01',
      idEtapaSubOrdem: 'OF-001-A-01',
      quantidadeProduzida: 1
    });
    component.maquinaSelecionada = maquinaDisponivel;

    expect(component.podeIniciar).toBeTrue();

    component.listaDeExecucoes = [
      {
        id: 'exec-ativa',
        maquinaNome: 'MAQUINA 01',
        subOrdemId: 'OF-001-A-01',
        status: 'RODANDO'
      }
    ];

    expect(component.podeIniciar).toBeFalse();
  });

  it('deve iniciar execucao com maquina e subordem', () => {
    component.listaDeMaquinas = [{ id: 'M-01', nome: 'MAQUINA 01', operacional: true }];
    component.maquinaSelecionada = component.listaDeMaquinas[0];
    component.opForm.patchValue({
      idMaquina: 'M-01',
      idEtapaSubOrdem: 'OF-001-A-01'
    });

    component.onIniciar();

    expect(executionOrderServiceSpy.iniciar).toHaveBeenCalledWith({
      idMaquina: 'M-01',
      idEtapaSubOrdem: 'OF-001-A-01'
    });
    expect(component.execucaoAtual?.id).toBe('exec-1');
  });

  it('deve finalizar execucao rodando com quantidade', () => {
    component.execucaoAtual = {
      id: 'exec-1',
      maquinaNome: 'MAQUINA 01',
      subOrdemId: 'OF-001-A-01',
      status: 'RODANDO'
    };
    component.opForm.patchValue({ quantidadeProduzida: 3 });

    component.onFinalizar();

    expect(executionOrderServiceSpy.finalizar).toHaveBeenCalledWith({
      idExecucao: 'exec-1',
      quantidadeProduzida: 3
    });
  });

  it('deve cancelar execucao rodando', () => {
    component.execucaoAtual = {
      id: 'exec-1',
      maquinaNome: 'MAQUINA 01',
      subOrdemId: 'OF-001-A-01',
      status: 'RODANDO'
    };

    component.onCancelar();

    expect(executionOrderServiceSpy.cancelar).toHaveBeenCalledWith('exec-1');
  });

  it('deve mostrar saldo da subordem selecionada', () => {
    component.listaDeOrdens = [
      {
        codigoEtapa: 'OF-100-A-01',
        ordemNumero: 'OF-100',
        quantidadeTotal: 4,
        quantidadeProduzida: 1
      }
    ];
    component.opForm.patchValue({ idEtapaSubOrdem: 'OF-100-A-01' });

    expect(component.loteSelecionado).toBe('OF-100-A-01');
    expect(component.saldoSelecionado).toBe('1 / 4 PEÇAS');
  });

  it('deve manter execucao pausada vinculada a maquina e bloquear novo inicio', () => {
    const maquina: MachineResponseDTO = { id: 'M-01', nome: 'MAQUINA 01', operacional: true };
    component.listaDeMaquinas = [maquina];
    component.maquinaSelecionada = maquina;
    component.listaDeExecucoes = [{
      id: 'exec-pausada',
      maquinaId: 'M-01',
      maquinaNome: 'MAQUINA 01',
      subOrdemId: 'OF-001-A-01',
      status: 'PAUSADA_POR_QUEBRA'
    }];
    component.opForm.patchValue({ idMaquina: 'M-01', idEtapaSubOrdem: 'OF-002-A-01' });

    expect(component.execucoesEmAndamento.length).toBe(1);
    expect(component.podeIniciar).toBeFalse();

    component.execucaoAtual = component.listaDeExecucoes[0];
    expect(component.podeFinalizar).toBeFalse();
  });

  it('nao deve oferecer ordens ou etapas encerradas para apontamento', () => {
    executionOrderServiceSpy.listarOrdens.and.returnValue(of([
      {
        numeroOrdem: 'OF-CANCELADA',
        status: 'CANCELADO',
        subOrdens: [{ codigoEtapa: 'OF-CANCELADA-A-01', quantidadeTotal: 2, quantidadeProduzida: 0, status: 'CANCELADO' }]
      },
      {
        numeroOrdem: 'OF-ATIVA',
        status: 'AGUARDANDO',
        subOrdens: [
          { codigoEtapa: 'OF-ATIVA-A-01', quantidadeTotal: 2, quantidadeProduzida: 0, status: 'AGUARDANDO' },
          { codigoEtapa: 'OF-ATIVA-A-02', quantidadeTotal: 2, quantidadeProduzida: 0, status: 'FINALIZADO' }
        ]
      }
    ]));

    component.carregarOrdensPlanejadas();

    expect(component.listaDeOrdens.map((item) => item.codigoEtapa)).toEqual(['OF-ATIVA-A-01']);
  });
});
