export interface User {
  localId: string // Generado por dispositivo
  nombre: string;
  correo: string;
  passwordHash: string;
  activo: boolean;
  empresaId: string;
  fechaCreacion?: string;
  ultimoAcceso?: string;
}