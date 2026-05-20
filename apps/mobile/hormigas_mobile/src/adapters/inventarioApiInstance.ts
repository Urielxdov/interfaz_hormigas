import { ApiHttpClient, TokenServiceImpl, SqliteInventaryForSaleImpl } from '@hormigas/infrastructure'
import { InventarioResponseDTO } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export type InventarioLocalItem = {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

type InventarioApi = {
  stockBajo(): Promise<InventarioResponseDTO[]>
}

let _api: InventarioApi | null = null

export const getInventarioApi = (): InventarioApi => {
  if (_api) return _api
  const tokenService = new TokenServiceImpl(storage)
  const http = new ApiHttpClient(API_URL, tokenService)
  _api = {
    stockBajo: () => http.get<InventarioResponseDTO[]>('/api/inventario/stockBajo'),
  }
  return _api
}

export const getInventarioLocalRepo = async (): Promise<SqliteInventaryForSaleImpl> => {
  const db = await getDB()
  const dbClient = new ExpoSQLiteClient(db)
  return new SqliteInventaryForSaleImpl(dbClient)
}
