export interface User {
  nombre: string;
  correo: string;
  passwordHash: string;
  activo: boolean;
  empresaId?: number;
  fechaCreacion?: string;
  ultimoAcceso?: string;
}