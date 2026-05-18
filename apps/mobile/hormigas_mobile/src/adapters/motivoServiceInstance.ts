import {
  ApiHttpClient,
  ApiMotivoRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _repo: ApiMotivoRepositoryImpl | null = null
let _initPromise: Promise<ApiMotivoRepositoryImpl> | null = null

export const getMotivoRepo = (): Promise<ApiMotivoRepositoryImpl> => {
  if (_repo) return Promise.resolve(_repo)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)
    _repo = new ApiMotivoRepositoryImpl(httpClient)
    return _repo
  })()

  return _initPromise
}
