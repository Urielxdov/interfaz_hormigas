import { UserRequestDTO, UserTokenDTO } from "../dtos/User";
import { IUserService } from "./interfaces/UserService";


export class UserServiceImpl implements IUserService {

  async login(dto: UserRequestDTO): Promise<UserTokenDTO> {
    try {
      const response = await fetch('http://192.168.100.4:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': "application/json"
        },
        body: JSON.stringify(dto)
      })

      if (!response.ok) {
        console.error("paso algo pay")
        console.error(response)
        throw new Error("Error")
      }

      const user: UserTokenDTO = await response.json();
      return user
    } catch (err) {
      console.log("Error catch login: ", err)
      throw err
    }
  }

}