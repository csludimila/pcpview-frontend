export type MachineStatus = 'DISPONIVEL' | 'TRABALHANDO' | 'PAUSADO' | 'MANUTENÇÃO';

export interface MachineModel {
  id?: string;          // 
  nome: string;
  operacional: boolean;
  status?: MachineStatus; 
  ofAtiva?: string;
}