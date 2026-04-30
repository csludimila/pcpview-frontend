// src/app/models/machine.model.ts
export enum MachineStatus {
  DISPONIVEL = 'DISPONIVEL',
  TRABALHANDO = 'TRABALHANDO',
  QUEBRADA = 'QUEBRADA'
}

export interface MachineModel {
  id?: number;
  nome: string;
  status: MachineStatus;
}

