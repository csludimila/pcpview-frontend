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
      'buscarMaquinaPorId',
      'alterarNome',
      'deletarMaquina',
      'registrarMaquina',
      'alternarStatusOperacional'
    ]);
    executionOrderServiceSpy = jasmine.createSpyObj('ExecutionOrderService', ['listarTodas']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin']);

    machineServiceSpy.buscarTodasMaquinas.and.returnValue(of([]));
    machineServiceSpy.buscarMaquinaPorId.and.returnValue(of({ id: 'M-01', nome: 'TORNO CNC', operacional: true }));
    machineServiceSpy.alterarNome.and.returnValue(of({ id: 'M-01', nome: 'TORNO CNC', operacional: true }));
    machineServiceSpy.registrarMaquina.and.returnValue(of({ id: 'M-02', nome: 'FRESA', operacional: true }));
    machineServiceSpy.alternarStatusOperacional.and.returnValue(of({ id: 'M-01', nome: 'TORNO CNC', operacional: false }));
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

  it('deve cadastrar maquina com ID e nome em uppercase', () => {
    component.novaMaquinaId = 'm-02';
    component.novaMaquinaNome = 'fresa';

    component.adicionarMaquina();

    expect(machineServiceSpy.registrarMaquina).toHaveBeenCalledWith({ id: 'M-02', nome: 'FRESA' });
  });

  it('deve buscar maquina por ID', () => {
    component.buscaMaquinaId = 'm-01';

    component.buscarMaquinaPorId();

    expect(machineServiceSpy.buscarMaquinaPorId).toHaveBeenCalledWith('M-01');
    expect(component.maquinaEncontrada?.nome).toBe('TORNO CNC');
  });

  it('deve editar nome da maquina em uppercase', () => {
    component.iniciarEdicaoMaquina({ id: 'M-01', nome: 'Torno antigo' });
    component.nomeMaquinaEditado = 'torno cnc';

    component.salvarNomeMaquina({ id: 'M-01', nome: 'Torno antigo' });

    expect(machineServiceSpy.alterarNome).toHaveBeenCalledWith('M-01', { nome: 'TORNO CNC' });
    expect(component.maquinaEdicaoId).toBe('');
  });

  it('deve alternar status operacional', () => {
    component.alternarStatus('M-01');

    expect(machineServiceSpy.alternarStatusOperacional).toHaveBeenCalledWith('M-01');
  });

  it('deve associar execucao ativa pelo nome da maquina quando o backend nao retorna maquinaId', () => {
    component.execucoesAbertas = [
      {
        id: 'exec-1',
        maquinaNome: 'TORNO CNC',
        subOrdemId: 'OF-100-A-01',
        operadorNome: 'operador@pcpview.local',
        status: 'RODANDO'
      }
    ];

    expect(component.execucaoAtivaDaMaquina({ id: 'M-01', nome: 'TORNO CNC' })?.id).toBe('exec-1');
  });
});
