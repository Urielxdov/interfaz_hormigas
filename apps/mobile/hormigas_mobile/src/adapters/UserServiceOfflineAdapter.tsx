import { IUserService } from "@hormigas/application";
import { UserRequestDTO, UserTokenDTO } from "@hormigas/domain";


export default class UserServiceOfflineAdapter implements IUserService {
    login(dto: UserRequestDTO): Promise<UserTokenDTO> {
        throw new Error("Method not implemented.");
    }
}