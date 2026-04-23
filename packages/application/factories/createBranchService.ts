import { IBranchRepository } from '../repositories/branch.repository'
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { IApiBranchRepository } from '../port/branch-api.port'
import { BranchService } from '../services/branch.service'

export const createBranchService = (
  localRepo: IBranchRepository,
  syncQueueRepo: ISyncQueueRepository,
  apiRepo: IApiBranchRepository
): BranchService => {
  return new BranchService(localRepo, syncQueueRepo, apiRepo)
}
