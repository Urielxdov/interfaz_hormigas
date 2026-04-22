import { useMemo } from 'react'
import { createUserService, IUserService } from '@hormigas/application'

export const useUserServiceFactorie = (
    onlineAdapter: IUserService,
    offlineAdapter: IUserService,
    isOnline: boolean
): IUserService => {
    return useMemo(
        () => createUserService(onlineAdapter, offlineAdapter, isOnline),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isOnline]
    )
}
