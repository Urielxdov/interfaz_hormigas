import { UserRequestDTO, UserTokenDTO } from "../../../domain";


export interface IUserService {
  login(dto: UserRequestDTO): Promise<UserTokenDTO>
}