export enum OrderStatus {
  AGUARDANDO = 'AGUARDANDO',
  FABRICANDO = 'FABRICANDO',
  PARADA = 'PARADA',
  FINALIZADA = 'FINALIZADA'
}

export interface ProductOrderModel {
  id?: number;
  ofPrincipal: string; // Ex: 1000
  ofGerada: string;    // Ex: 1000-A-01
  qtdTotal: number;
  qtdProduzida: number;
  qtdRestante: number;
  status: OrderStatus;
  etapaMaquina: string;
}