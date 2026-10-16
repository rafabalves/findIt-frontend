import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { useCallback } from 'react'
import { loginRequest } from './auth'

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export const apiUrl = (path: string) => `${baseUrl}${path}`

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  protected?: boolean
}

export async function publicApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return send<T>(path, options)
}

async function send<T>(path: string, options: RequestOptions, token?: string): Promise<T> {
  const { body, protected: _requiresAuth, ...rest } = options
  const headers = new Headers(rest.headers)
  if (body !== undefined && !(body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique se o backend está em execução.', 0)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as
      | { detail?: string; title?: string; errors?: Record<string, string[]> } | null
    const validation = payload?.errors ? Object.values(payload.errors).flat().join(' ') : ''
    throw new ApiError(validation || payload?.detail || payload?.title || `Erro ${response.status} ao acessar a API.`, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function useApi() {
  const { instance, accounts } = useMsal()
  const accountId = instance.getActiveAccount()?.homeAccountId ?? accounts[0]?.homeAccountId
  return useCallback(async <T,>(path: string, options: RequestOptions = {}): Promise<T> => {
    if (!options.protected) return send<T>(path, options)
    const account = accountId ? instance.getAccountByHomeId(accountId) : null
    if (!account) {
      throw new ApiError('Entre com sua conta Microsoft para continuar.', 401)
    }
    let token: string
    try {
      const result = await instance.acquireTokenSilent({ ...loginRequest, account })
      token = result.accessToken
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({ ...loginRequest, account })
        throw new ApiError('Redirecionando para autenticação…', 401)
      }
      throw error
    }
    return send<T>(path, options, token)
  }, [instance, accountId])
}
