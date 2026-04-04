import { TypeTransaction } from "./TypeTransaction";

export interface Transaction {
  inventarioId?: number;
  usuarioId?: number;
  tipoMovimiento: TypeTransaction;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  referencia?: string;
  fecha?: string;
  sincronizado: boolean;
}