import { Sale } from '@hormigas/domain'

export interface ISaleRepository {
    save(sale: Sale): Promise<void>
    findAll(): Promise<Sale[]>
    findByDate(fecha: string): Promise<Sale[]>
    /** Marca la venta como reconocida por el servidor. */
    markSynced(localId: string): Promise<void>
}
