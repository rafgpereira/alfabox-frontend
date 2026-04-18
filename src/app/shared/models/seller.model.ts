export interface Seller {
  id: string;
  name: string;
  document: string;
  isActive: boolean;
}

export interface CreateSeller {
  name: string;
  document: string;
}

export interface UpdateSeller {
  name?: string;
  isActive?: boolean;
}
