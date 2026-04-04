export interface Inventary {
  id: number;
  productoId: number;
  sucursalId: number;
  stockActual: number;
  stockMinimo?: number;
  stockMaximo: number;
  ultimaActualizacion?: string;
}