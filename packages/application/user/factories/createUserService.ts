import { IUserService } from "../interfaces/IUserService";
import { TokenService } from "../interfaces/TokenService";
import { UserServiceHTTP } from "../UserServiceHTTP";
import { UserServiceOffline } from "../UserServiceOffline";

export const createUserService = (
    tokenService: TokenService,
    isOnline: boolean
): IUserService => {
    return isOnline
        ? new UserServiceHTTP(tokenService)
        : new UserServiceOffline(tokenService)
}