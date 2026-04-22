export interface Product {
  localId: string // Generado por dispositivo
  nombre: string;
  sku: string;
  descripcion?: string;
  precio?: number;
  activo: boolean;
  categoria?: string;
  categoriaId?: number; // ID del servidor (disponible tras sincronizar)
}
