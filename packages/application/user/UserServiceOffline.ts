import { UserRequestDTO, UserTokenDTO } from '@hormigas/domain';
import { IUserService } from '@hormigas/application/user/interfaces/IUserService'
import { TokenService } from '@hormigas/application/user/interfaces/TokenService';

export class UserServiceOffline implements IUserService {

    constructor (private tokenService: TokenService) {}
    login(dto: UserRequestDTO): Promise<UserTokenDTO> {
        throw new Error('Method not implemented.');
    }

}