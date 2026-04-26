export interface ServiceOrderAddress {
  street: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  complement: string | null;
  city: string | null;
}

export interface CreateServiceOrderItem {
  productId: string | null;
  quantity: number | null;
  amount: number | null;
  details: string | null;
}

export interface CreateInitialPayment {
  amount: number;
  paymentDate: string;
  method: string;
  installments?: number | null;
}

export interface CreateServiceOrder {
  clientId: string;
  sellerId: string;
  orderDate: string;
  totalAmount: number;
  observation?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  complement?: string | null;
  city?: string | null;
  items: CreateServiceOrderItem[];
  initialPayment?: CreateInitialPayment | null;
}

export interface ServiceOrder {
  id: string;
  code: string;
  orderDate: string;
  totalAmount: number;
  observation: string | null;
}

export type PaymentStatus = 'PAGO' | 'PARCIAL' | 'ABERTO';
export type ExecutionStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';

/** Payload plano retornado pelo endpoint GET /service-orders (tabela geral). */
export interface ServiceOrderListItem {
  id: string;
  code: string;
  orderDate: string; // YYYY-MM-DD
  clientName: string;
  sellerName: string;
  totalAmount: number;
  paidAmount: number;
  executedAmount: number;
  lastPaymentDate: string | null; // YYYY-MM-DD
  paymentStatus: PaymentStatus;
  executionStatus: ExecutionStatus;
}

// ── Detalhe completo da OS (GET /service-orders/code/:code) ──────────────

export interface ServiceOrderDetailPhone {
  id: string;
  number: string;
}

export interface ServiceOrderDetailClient {
  id: string;
  name: string;
  personType: string;
  document: string | null;
  isActive: boolean;
  phones: ServiceOrderDetailPhone[];
}

export interface ServiceOrderDetailSeller {
  id: string;
  name: string;
}

export interface ServiceOrderDetailItem {
  id: string;
  sequence: number;
  quantity: number | null;
  amount: number | null;
  details: string | null;
  product: { id: string; name: string } | null;
}

export interface ServiceOrderDetailPayment {
  id: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: string;
  installments: number | null;
}

export interface ServiceOrderDetailAssembler {
  id: string;
  name: string;
}

export interface ServiceOrderDetailExecution {
  id: string;
  amount: number;
  executionDate: string; // YYYY-MM-DD
  splitAmount: number;
  assemblers: ServiceOrderDetailAssembler[];
}

export interface ServiceOrderDetail {
  id: string;
  code: string;
  orderDate: string; // YYYY-MM-DD
  observation: string | null;
  totalAmount: number;
  address: {
    street: string | null;
    addressNumber: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
  };
  client: ServiceOrderDetailClient;
  seller: ServiceOrderDetailSeller;
  items: ServiceOrderDetailItem[];
  payments: ServiceOrderDetailPayment[];
  executions: ServiceOrderDetailExecution[];
  paidAmount: number;
  executedAmount: number;
  paymentStatus: PaymentStatus;
  executionStatus: ExecutionStatus;
}
