export type MaintenanceType = 'NORMAL' | 'WARRANTY';
export type MaintenancePaymentStatus = 'PAGO' | 'PARCIAL' | 'ABERTO';
export type MaintenanceExecutionStatus = 'PENDENTE' | 'CONCLUIDO';

// ── Payload de criação ───────────────────────────────────────────────────

export interface CreateMaintenance {
  type: MaintenanceType;
  clientId: string;
  serviceOrderId?: string | null;
  maintenanceDate: string; // YYYY-MM-DD
  observation?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  complement?: string | null;
  city?: string | null;
  productDescription?: string | null;
  productAmount?: number | null;
  laborAmount?: number | null;
}

// ── Payload de atualização de endereço ───────────────────────────────────

export interface UpdateMaintenanceAddress {
  street: string | null;
  addressNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
}

// ── Payload de atualização de OS de origem ──────────────────────────────

export interface UpdateMaintenanceServiceOrder {
  serviceOrderId: string | null;
}

// ── Payload de atualização de produto ───────────────────────────────────

export interface UpdateMaintenanceProduct {
  productDescription: string | null;
  productAmount: number | null;
}

// ── Resposta resumida (create / register-execution) ──────────────────────

export interface MaintenanceResponse {
  id: string;
  code: string;
  type: MaintenanceType;
  maintenanceDate: string;
  totalAmount: number;
}

// ── Item da listagem (GET /maintenances) ─────────────────────────────────

export interface MaintenanceListItem {
  id: string;
  code: string;
  maintenanceDate: string; // YYYY-MM-DD
  clientName: string;
  type: MaintenanceType;
  totalAmount: number;
  laborAmount: number;
  productAmount: number;
  paidAmount: number;
  paymentStatus: MaintenancePaymentStatus;
  executionStatus: MaintenanceExecutionStatus;
  assemblerNames: string | null;
}

// ── Detalhe completo (GET /maintenances/:code) ───────────────────────────

export interface MaintenanceDetailPhone {
  id: string;
  number: string;
}

export interface MaintenanceDetailClient {
  id: string;
  name: string;
  personType: string;
  document: string | null;
  isActive: boolean;
  phones: MaintenanceDetailPhone[];
}

export interface MaintenanceDetailAddress {
  street: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  complement: string | null;
  city: string | null;
}

export interface MaintenanceDetailAssembler {
  id: string;
  name: string;
}

export interface MaintenanceDetailPayment {
  id: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: string;
  installments: number | null;
  maintenanceId: string;
}

export interface MaintenanceDetail {
  id: string;
  code: string;
  type: MaintenanceType;
  serviceOrderCode: string | null;
  serviceOrderId: string | null;
  client: MaintenanceDetailClient;
  address: MaintenanceDetailAddress;
  maintenanceDate: string; // YYYY-MM-DD
  observation: string | null;
  productDescription: string | null;
  productAmount: number;
  laborAmount: number;
  totalAmount: number;
  payments: MaintenanceDetailPayment[];
  paidAmount: number;
  paymentStatus: MaintenancePaymentStatus;
  executionDate: string | null; // YYYY-MM-DD
  assemblers: MaintenanceDetailAssembler[];
  executionStatus: MaintenanceExecutionStatus;
  vidracariaAmount: number;
  assemblersTotalAmount: number;
  amountPerAssembler: number;
  createdAt: string;
  updatedAt: string;
}
