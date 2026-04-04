export interface Inventary {
  productoId: number;
  sucursalId: number;
  stockActual: number;
  stockMinimo?: number;
  stockMaximo: number;
  ultimaActualizacion?: string;
}