export interface Assembler {
  id: string;
  name: string;
  document: string;
  isActive: boolean;
}

export interface CreateAssembler {
  name: string;
  document: string;
}

export interface UpdateAssembler {
  name?: string;
  isActive?: boolean;
}
