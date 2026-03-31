// packages/ui/src/hooks/useUserService.ts
import { createUserService } from "@hormigas/application";
import { IUserService } from "@hormigas/application/user/interfaces/IUserService";
import { TokenService } from "@hormigas/application/user/interfaces/TokenService";
import { useMemo } from "react";

export const useUserService = (
    tokenService: TokenService,
    isOnline: boolean
): IUserService => {
    return useMemo(
        () => createUserService(tokenService, isOnline),
        [isOnline]
    );
};