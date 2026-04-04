export interface Product {
  nombre: string;
  sku: string;
  descripcion?: string;
  precio?: number;
  activo: boolean;
  categoriaId?: number;
}
