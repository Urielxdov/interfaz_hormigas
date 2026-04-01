// packages/ui/src/hooks/useUserService.ts

import { useMemo } from "react";
import { TokenService, createUserService, IUserService } from '@hormigas/application' 



export const useUserServiceFactorie = (
    tokenService: TokenService,
    isOnline: boolean,
    offlineAdapter?: IUserService
): IUserService =>  {
    return useMemo(
        () => createUserService(tokenService, isOnline, offlineAdapter),
        [isOnline]
    );
};