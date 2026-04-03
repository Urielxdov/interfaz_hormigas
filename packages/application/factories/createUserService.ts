import { IUserService } from "../port/IUserService";
import { TokenService } from "../port/TokenService";
import { UserServiceHTTP } from "../user/UserServiceHTTP";
import { UserServiceOffline } from "../user/UserServiceOffline";

export const createUserService = (
    tokenService: TokenService,
    isOnline: boolean,
    offlineAdapter?: IUserService
): IUserService => {
    return isOnline
        ? new UserServiceHTTP(tokenService)
        : offlineAdapter ?? new UserServiceOffline(tokenService)
}