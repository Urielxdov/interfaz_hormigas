import { UserServiceHTTP, UserServiceOffline } from "@hormigas/application";
import { IUserService } from "@hormigas/application/user/interfaces/IUserService";
import { TokenService } from "@hormigas/application/user/interfaces/TokenService";
import { useMemo } from "react";

export const useUserServiceFactory = (
    tokenService: TokenService,
    isOnline: boolean
): IUserService => {
    return useMemo(() => {
        return isOnline
            ? new UserServiceHTTP(tokenService)
            : new UserServiceOffline(tokenService)
    }, [isOnline])
}