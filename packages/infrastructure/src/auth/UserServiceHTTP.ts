import { IUserService, TokenService, UserRequestDTO } from "@hormigas/application"
import { UserTokenDTO } from "../user/user.token.dto"

export class UserServiceHTTP implements IUserService {

  constructor(private tokenService: TokenService) { }

  async login(dto: UserRequestDTO): Promise<UserTokenDTO> {
    const res = await fetch('http://10.44.1.140:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })

    const data: UserTokenDTO = await res.json()

    // Delega al TokenService, no toca storage directamente
    await this.tokenService.saveToken(data.token)
    // await this.tokenService.saveRefreshToken(data.refreshToken) // si aplica

    return data
  }
}
