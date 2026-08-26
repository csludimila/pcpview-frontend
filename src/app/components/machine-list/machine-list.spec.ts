import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { MachineListComponent } from './machine-list';
import { MachineService } from '../../services/machine.service';
import { ExecutionOrderService } from '../../services/execution-order.service';
import { AuthService } from '../../services/auth.service';

describe('MachineListComponent', () => {
  let component: MachineListComponent;
  let fixture: ComponentFixture<MachineListComponent>;
  let machineServiceSpy: jasmine.SpyObj<MachineService>;
  let executionOrderServiceSpy: jasmine.SpyObj<ExecutionOrderService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    machineServiceSpy = jasmine.createSpyObj('MachineService', [
      'buscarTodasMaquinas',
      'alterarNome',
      'deletarMaquina',
      'registrarMaquina',
      'alternarStatusOperacional'
    ]);
    executionOrderServiceSpy = jasmine.createSpyObj('ExecutionOrderService', [
      'listarOrdens',
      'listarTodas',
      'alterarMaquinaIdeal',
      'removerDaFila',
      'reordenarFila'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin']);

    machineServiceSpy.buscarTodasMaquinas.and.returnValue(of([]));
    machineServiceSpy.alterarNome.and.returnValue(of({ id: 'M-01', nome: 'TORNO CNC' }));
    executionOrderServiceSpy.listarOrdens.and.returnValue(of([]));
    executionOrderServiceSpy.listarTodas.and.returnValue(of([]));
    authServiceSpy.isAdmin.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [MachineListComponent],
      providers: [
        provideHttpClient(),
        { provide: MachineService, useValue: machineServiceSpy },
        { provide: ExecutionOrderService, useValue: executionOrderServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve consultar permissao admin pelo AuthService', () => {
    authServiceSpy.isAdmin.and.returnValue(true);

    expect(component.isAdmin).toBeTrue();
    expect(authServiceSpy.isAdmin).toHaveBeenCalled();
  });

  it('deve editar nome da maquina em uppercase', () => {
    component.iniciarEdicaoMaquina({ id: 'M-01', nome: 'Torno antigo' });
    component.nomeMaquinaEditado = 'torno cnc';

    component.salvarNomeMaquina({ id: 'M-01', nome: 'Torno antigo' });

    expect(machineServiceSpy.alterarNome).toHaveBeenCalledWith('M-01', { nome: 'TORNO CNC' });
    expect(component.maquinaEdicaoId).toBe('');
  });

  it('deve mostrar OF e operador ativos no card da maquina', () => {
    component.execucoesAbertas = [
      {
        id: 'exec-1',
        maquinaId: 'M-01',
        maquinaNome: 'TORNO CNC',
        subOrdemId: 'OF-100-A-01',
        operadorNome: 'OPERADOR TESTE',
        status: 'RODANDO'
      }
    ];

    expect(component.textoOFAtiva({ id: 'M-01', nome: 'TORNO CNC' })).toBe('OF-100-A-01');
    expect(component.textoOperadorAtivo({ id: 'M-01', nome: 'TORNO CNC' })).toBe('OPERADOR TESTE');
  });

  it('deve mostrar quantidade feita, total e restante da OF ativa', () => {
    component.execucoesAbertas = [
      {
        id: 'exec-1',
        maquinaId: 'M-01',
        subOrdemId: 'OF-200-A-01',
        operadorNome: 'OPERADOR TESTE',
        status: 'RODANDO'
      }
    ];
    component.ordens = [
      {
        numeroOrdem: 'OF-200',
        quantidadeTotal: 10,
        quantidadeProduzida: 4,
        status: 'EM_PROCESSAMENTO',
        subOrdens: [
          {
            codigoEtapa: 'OF-200-A-01',
            quantidadeTotal: 10,
            quantidadeProduzida: 4,
            status: 'EM_PROCESSAMENTO',
            maquinaIdealId: 'M-01'
          }
        ]
      }
    ];

    expect(component.textoQuantidadeAtiva({ id: 'M-01', nome: 'TORNO CNC' })).toBe('4 / 10 feitas');
    expect(component.textoRestanteAtivo({ id: 'M-01', nome: 'TORNO CNC' })).toBe('Restam 6');
  });

  it('deve usar saldo direto da execucao ativa quando ordens ainda nao carregaram', () => {
    component.execucoesAbertas = [
      {
        id: 'exec-1',
        maquinaId: 'M-01',
        subOrdemId: 'OF-300-A-01',
        operadorNome: 'OPERADOR TESTE',
        status: 'RODANDO',
        quantidadeTotal: 12,
        quantidadeProduzida: 5,
        quantidadeRestante: 7
      }
    ];
    component.ordens = [];

    expect(component.textoQuantidadeAtiva({ id: 'M-01', nome: 'TORNO CNC' })).toBe('5 / 12 feitas');
    expect(component.textoRestanteAtivo({ id: 'M-01', nome: 'TORNO CNC' })).toBe('Restam 7');
  });
});
