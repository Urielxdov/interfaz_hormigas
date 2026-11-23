/** Ejecuta varias operaciones de persistencia de forma atomica (todo o nada). */
export interface IUnitOfWork {
    run<T>(fn: () => Promise<T>): Promise<T>
}
