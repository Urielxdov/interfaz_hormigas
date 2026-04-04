import { IUserService } from "../port/user.port";
import { TokenService } from "../port/token.port";
import { UserServiceHTTP } from "../../infrastructure/src/auth/UserServiceHTTP";

export const createUserService = (
    tokenService: TokenService,
    isOnline: boolean,
    offlineAdapter: IUserService
): IUserService => {
    return isOnline
        ? new UserServiceHTTP(tokenService)
        : offlineAdapter
}