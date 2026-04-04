import { UserTokenDTO } from "../../infrastructure/src/user/user.token.dto";
import { UserRequestDTO } from "../use-cases/user/request.user.dto";

export interface IUserService {
  login(dto: UserRequestDTO): Promise<UserTokenDTO>
}