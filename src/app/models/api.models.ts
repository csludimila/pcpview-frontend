export type UserRole = 'USER' | 'ADMIN';
export type StatusProducao = 'AGUARDANDO' | 'EM_PROCESSAMENTO' | 'FINALIZADO' | 'CANCELADO';
export type ExecutionStatus = 'RODANDO' | 'FINALIZADA' | 'PAUSADA_POR_QUEBRA';

export interface RegisterRequestDTO {
  userName: string;
  email: string;
  password: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
}

export interface UserResponseDTO {
  id?: string;
  login?: string;
  role?: UserRole;
}

export interface MachineRequestDTO {
  id: string;
  nome: string;
}

export interface MachineResponseDTO {
  id?: string;
  nome?: string;
  operacional?: boolean;
}

export interface UpdateMachineNameDTO {
  nome: string;
}

export interface ProductRequestDTO {
  id: string;
  sku: string;
  nome: string;
}

export interface ProductResponseDTO {
  id?: string;
  sku?: string;
  nome?: string;
}

export interface UpdateProductNameDTO {
  nome: string;
}

export interface SubsetRequestDTO {
  letra: string;
  quantidadeEtapas: number;
}

export interface OrderRequestDTO {
  numeroOrdem: string;
  quantidadeTotal: number;
  subconjuntos?: SubsetRequestDTO[];
}

export interface SubOrderResponseDTO {
  codigoEtapa?: string;
  quantidadeTotal?: number;
  quantidadeProduzida?: number;
}

export interface OrderResponseDTO {
  numeroOrdem?: string;
  quantidadeTotal?: number;
  quantidadeProduzida?: number;
  prioridade?: number;
  dataCriacao?: string;
  subOrdens?: SubOrderResponseDTO[];
}

export interface ExecutionStartRequestDTO {
  idMaquina: string;
  idEtapaSubOrdem: string;
}

export interface ExecutionFinishRequestDTO {
  idExecucao: string;
  quantidadeProduzida: number;
}

export interface ExecutionResponseDTO {
  id?: string;
  maquinaId?: string;
  maquinaNome?: string;
  subOrdemId?: string;
  operadorNome?: string;
  status?: ExecutionStatus;
  dataInicio?: string;
  dataFim?: string;
}
