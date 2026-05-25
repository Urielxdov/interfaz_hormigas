import { ApiHttpClient, ApiCategoriaRepositoryImpl, TokenServiceImpl } from '@hormigas/infrastructure'
import { IApiCategoriaRepository } from '@hormigas/application'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _repo: IApiCategoriaRepository | null = null

export const getCategoriaRepo = (): IApiCategoriaRepository => {
    if (!_repo) {
        const tokenService = new TokenServiceImpl(storage)
        const http = new ApiHttpClient(API_URL, tokenService)
        _repo = new ApiCategoriaRepositoryImpl(http)
    }
    return _repo
}
