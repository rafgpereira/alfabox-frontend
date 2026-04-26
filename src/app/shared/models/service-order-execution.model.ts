export interface ServiceOrderExecution {
  id: string;
  amount: number;
  executionDate: string; // YYYY-MM-DD
  splitAmount: number;
  assemblerIds: string[];
}

export interface CreateServiceOrderExecution {
  amount: number;
  executionDate: string; // YYYY-MM-DD
  assemblerIds: string[];
}

export interface UpdateServiceOrderExecution {
  amount?: number;
  executionDate?: string; // YYYY-MM-DD
}
