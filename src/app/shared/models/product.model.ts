/**
 * Espelha o ResponseProductDto do backend.
 * Usamos interface (e não class) porque no frontend não precisamos
 * de instanciação — o Angular HttpClient já retorna objetos tipados.
 */
export interface Product {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * Payload para criação de produto.
 * Espelha o CreateProductDto do backend.
 */
export interface CreateProduct {
  name: string;
}

/**
 * Payload para atualização de produto.
 * Espelha o UpdateProductDto do backend.
 * Todos os campos são opcionais (Partial).
 */
export interface UpdateProduct {
  name?: string;
  isActive?: boolean;
}
