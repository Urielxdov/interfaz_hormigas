import { Branch } from '@hormigas/domain'

export interface IBranchRepository {
  findAll(): Promise<Branch[]>
  findById(localId: string): Promise<Branch | null>
  save(branch: Branch, synced?: boolean): Promise<boolean>
  markAsSynced(localId: string, serverId: number): Promise<boolean>
  deleteById(localId: string): Promise<boolean>
}
