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
