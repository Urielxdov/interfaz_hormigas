export interface Branch {
  localId: string
  serverId?: number // ID del servidor (disponible tras sincronizar)
  nombre: string
  direccion?: string
  responsable?: string
  codigo?: string
  telefono?: string
  ciudad?: string
  activa: boolean
}