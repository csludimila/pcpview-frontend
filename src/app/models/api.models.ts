// ==========================================
// AUTHENTICATION MODELS
// ==========================================
export interface RegisterRequestDTO {
  userName: string;
  email: string;
  password: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface UserResponseDTO {
  id?: string;
  userName?: string;
  email?: string;
  role?: 'USER' | 'SELLER' | 'ADMIN';
}

export interface ResetPasswordRequestDTO {
  password: string;
}

// ==========================================
// MACHINE MODELS
// ==========================================
export interface MachineRequestDTO {
  id: string;
  nome: string;
}

export interface MachineResponseDTO {
  id?: string;
  nome?: string;
  operacional?: boolean;
  statusOperacional?: 'DISPONIVEL' | 'TRABALHANDO' | 'MANUTENCAO';
}

export interface UpdateMachineNameDTO {
  nome: string;
}

// ==========================================
// PRODUCT MODELS
// ==========================================
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

// ==========================================
// ORDER MODELS
// ==========================================
export interface SubsetRequestDTO {
  letra: string;
  quantidadeEtapas: number;
}

export interface OrderRequestDTO {
  numeroOrdem: string;
  quantidadeTotal: number;
  produtoNome?: string;
  maquinaIdealId?: string | null;
  subconjuntos?: SubsetRequestDTO[];
}

export interface SubOrderResponseDTO {
  codigoEtapa?: string;
  quantidadeTotal?: number;
  quantidadeProduzida?: number;
  status?: 'AGUARDANDO' | 'EM_PROCESSAMENTO' | 'FINALIZADO' | 'CANCELADO';
  maquinaIdealId?: string | null;
  maquinaIdealNome?: string | null;
  posicaoFila?: number | null;
}

export interface OrderResponseDTO {
  numeroOrdem?: string;
  produtoNome?: string;
  produtoSku?: string;
  quantidadeTotal?: number;
  quantidadeProduzida?: number;
  status?: 'AGUARDANDO' | 'EM_PROCESSAMENTO' | 'FINALIZADO' | 'CANCELADO';
  subOrdens?: SubOrderResponseDTO[];
  dataInicio?: string;
  dataFim?: string;
  tempoProdutivoSegundos?: number;
  tempoSetupSegundos?: number;
  tempoRestanteLoteSegundos?: number;
  tempoMedioPorPecaSegundos?: number;
  tempoMedioRestanteSegundos?: number;
}

// ==========================================
// EXECUTION MODELS
// ==========================================
export interface ExecutionStartRequestDTO {
  idMaquina: string;
  idEtapaSubOrdem: string;
  setupPrimeiraPeca?: boolean;
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
  quantidadeTotal?: number;
  quantidadeProduzida?: number;
  quantidadeRestante?: number;
  operadorNome?: string;
  status?: 'RODANDO' | 'FINALIZADA' | 'PAUSADA_POR_QUEBRA' | 'CANCELADA_MANUTENCAO';
  dataInicio?: string;
  dataFim?: string;
  tempoProdutivoSegundos?: number;
  tempoSetupSegundos?: number;
  tempoRestanteLoteSegundos?: number;
  tempoMedioPorPecaSegundos?: number;
  tempoMedioRestanteSegundos?: number;
  setupPrimeiraPeca?: boolean;
}
