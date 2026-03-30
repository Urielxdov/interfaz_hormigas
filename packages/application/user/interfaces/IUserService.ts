import { UserRequestDTO, UserTokenDTO } from "@hormigas/domain";


export interface IUserService {
  login(dto: UserRequestDTO): Promise<UserTokenDTO>
}