export interface Product {
  id: number;
  nombre: string;
  sku: string;
  descripcion?: string;
  precio?: number;
  activo: boolean;
  categoriaId?: number;
}
