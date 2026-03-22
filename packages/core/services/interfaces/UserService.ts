import { UserRequestDTO, UserTokenDTO } from "../../dtos/User";

export interface IUserService {
  login(dto: UserRequestDTO): Promise<UserTokenDTO>
}