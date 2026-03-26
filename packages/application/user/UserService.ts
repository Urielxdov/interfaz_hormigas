import { UserRequestDTO, UserTokenDTO } from "../../domain/user/dto/User";

export interface IUserService {
  login(dto: UserRequestDTO): Promise<UserTokenDTO>
}