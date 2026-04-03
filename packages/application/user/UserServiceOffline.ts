import { UserRequestDTO, UserTokenDTO } from "@hormigas/domain";
import { IUserService } from "../port/IUserService";
import { TokenService } from "../port/TokenService";

export class UserServiceOffline implements IUserService {

    constructor(private tokenService: TokenService) { }
    login(dto: UserRequestDTO): Promise<UserTokenDTO> {
        throw new Error('Method not implemented.');
    }

}