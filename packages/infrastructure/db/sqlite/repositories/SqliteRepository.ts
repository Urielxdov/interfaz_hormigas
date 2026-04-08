export interface SqliteRepository<TEntity, TId = string> {
    findAll(): Promise<TEntity[]>
    findById(id: TId): Promise<TEntity | null>
    save(entity: TEntity): Promise<boolean>
    deleteById(id: TId): Promise<boolean>
    existsById(id: TId): Promise<boolean>
}
