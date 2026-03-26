export interface UserRequestDTO {
  email: string;
  password: string;
}

export interface UserResponseDTO {
  id: number;
  name: string;
  correo: string;
  empresaId: number
}

export interface UserTokenDTO {
  token: string
}