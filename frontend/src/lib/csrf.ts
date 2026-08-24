import { api } from '../api/client'

let cachedCsrfToken: string | null = null

export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) {
    return cachedCsrfToken
  }
  const { data } = await api.get<{ csrfToken: string }>('/csrf')
  cachedCsrfToken = data.csrfToken
  return cachedCsrfToken
}

export function clearCsrfToken(): void {
  cachedCsrfToken = null
}
