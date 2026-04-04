export interface User {
  localId: string // Generado por dispositivo
  nombre: string;
  correo: string;
  passwordHash: string;
  activo: boolean;
  empresaId?: number;
  fechaCreacion?: string;
  ultimoAcceso?: string;
}