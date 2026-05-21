import { ILocalBranchRepository, BranchService } from '../services/branch.service'
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { IApiBranchRepository } from '../port/branch-api.port'

export const createBranchService = (
  localRepo: ILocalBranchRepository,
  syncQueueRepo: ISyncQueueRepository,
  apiRepo: IApiBranchRepository
): BranchService => new BranchService(localRepo, syncQueueRepo, apiRepo)
