import { IUserService } from '../port/user.port'

export const createUserService = (
    onlineAdapter: IUserService,
    offlineAdapter: IUserService,
    isOnline: boolean
): IUserService => {
    return isOnline ? onlineAdapter : offlineAdapter
}
