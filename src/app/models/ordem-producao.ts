export enum OrderStatus {  // Verifique se o 'export' está aqui!
  AGUARDANDO = 'AGUARDANDO',
  FABRICANDO = 'FABRICANDO',
  PARADA = 'PARADA',
  FINALIZADA = 'FINALIZADA'
}
export interface ProductOrderModel {
  id: string;  
  sku: string;  
  nome: string; 
  status?: string;
  ofGerada?: string;
}