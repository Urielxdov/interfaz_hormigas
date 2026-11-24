/**
 * Ejecuta varias operaciones de persistencia de forma atomica (todo o nada).
 * Si la implementacion pasa un `scope`, las operaciones dentro de `fn` deben usar
 * esos repositorios (ligados a la transaccion) en lugar de los globales.
 */
export interface IUnitOfWork<S = unknown> {
    run<T>(fn: (scope?: S) => Promise<T>): Promise<T>
}
