export interface Inventary {
  localId: string // Generado por dispositivo
  productoId: number;
  sucursalId: number;
  stockActual: number;
  stockMinimo?: number;
  stockMaximo: number;
  ultimaActualizacion?: string;
}