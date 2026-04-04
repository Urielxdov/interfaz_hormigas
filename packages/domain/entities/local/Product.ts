export interface Product {
  localId: string // Generado por dispositivo
  nombre: string;
  sku: string;
  descripcion?: string;
  precio?: number;
  activo: boolean;
  categoriaId?: number;
}
