import { UserRequestDTO, UserTokenDTO } from '../../domain';
import { IUserService } from './interfaces/IUserService'
import { TokenService } from './interfaces/TokenService';

export class UserServiceOffline implements IUserService {

    constructor (private tokenService: TokenService) {}
    login(dto: UserRequestDTO): Promise<UserTokenDTO> {
        throw new Error('Method not implemented.');
    }

}