// packages/ui/src/hooks/useUserService.ts

import { useMemo } from "react";

export const useUserService = (
    tokenService: ,
    isOnline: boolean
): IUserService => {
    return useMemo(
        () => createUserService(tokenService, isOnline),
        [isOnline]
    );
};