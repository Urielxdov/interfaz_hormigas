import { IUserService, UserRequestDTO, UserTokenDTO } from '@hormigas/application'

export default class UserServiceOfflineAdapter implements IUserService {
    login(_dto: UserRequestDTO): Promise<UserTokenDTO> {
        return Promise.reject(new Error('Sin conexión: no se puede iniciar sesión offline.'))
    }
}
