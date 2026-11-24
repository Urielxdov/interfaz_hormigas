export interface Product {
  localId: string // Generado por dispositivo
  nombre: string;
  sku: string;
  descripcion?: string;
  precio?: number;
  activo: boolean;
  categoria?: string;
  /** ID de la categoria en el servidor. */
  categoriaId?: number;
  /** ID del producto en el servidor (disponible tras sincronizar). */
  serverId?: number;
  /** Suma del stock en todas las sucursales (cache del ultimo pull). */
  stockTotal?: number;
  /** false mientras tenga cambios locales sin enviar. */
  synced?: boolean;
}
