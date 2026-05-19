export enum OrderStatus {
  PLANEJADA = 'PLANEJADA',
  AGUARDANDO = 'AGUARDANDO',
  FABRICANDO = 'FABRICANDO',
  FINALIZADA = 'FINALIZADA'
}

export interface ProductOrderModel {
  
  numeroOrdem: string; 
  dataCriacao?: string;
  quantidadeProduzida: number;
  quantidadeTotal: number;
  status: OrderStatus;
  productId?: string;
}