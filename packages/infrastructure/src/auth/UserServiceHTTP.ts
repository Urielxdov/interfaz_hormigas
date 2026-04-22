import { IUserService, TokenService, UserRequestDTO } from '@hormigas/application'
import { UserTokenDTO } from '../user/user.token.dto'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class UserServiceHTTP implements IUserService {
    constructor(
        private tokenService: TokenService,
        private http: ApiHttpClient
    ) {}

    async login(dto: UserRequestDTO): Promise<UserTokenDTO> {
        const data = await this.http.post<UserTokenDTO>('/api/auth/login', dto)
        await this.tokenService.saveToken(data.token)
        return data
    }
}
