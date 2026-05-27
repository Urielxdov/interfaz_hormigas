import { BranchItemListDTO } from '../use-cases/branch/Branch'

export class DuplicateBranchError extends Error {
    constructor(public readonly existing: BranchItemListDTO) {
        super(`Ya existe una sucursal con el nombre "${existing.nombre}"`)
        this.name = 'DuplicateBranchError'
    }
}
