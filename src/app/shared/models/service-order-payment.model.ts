export type PaymentMethod = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';

export interface ServiceOrderPayment {
  id: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: PaymentMethod;
  installments: number | null;
}

export interface CreateServiceOrderPayment {
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: PaymentMethod;
  installments?: number | null;
}

export interface UpdateServiceOrderPayment {
  amount?: number;
  paymentDate?: string; // YYYY-MM-DD
  method?: PaymentMethod;
  installments?: number | null;
}
