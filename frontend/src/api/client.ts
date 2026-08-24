import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem('lb_token')
}

export function getStoredRefreshToken(): string | null {
  return sessionStorage.getItem('lb_refresh_token')
}

export function setStoredRefreshToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem('lb_refresh_token', token)
  } else {
    sessionStorage.removeItem('lb_refresh_token')
  }
}

const PUBLIC_API_PREFIXES = ['/login', '/register', '/feed', '/books/search', '/books/', '/csrf', '/token/refresh']

function isPublicApiRequest(url: string | undefined): boolean {
  if (!url) {
    return false
  }
  const path = url.startsWith('/api') ? url.slice(4) : url
  if (path.startsWith('/profiles/')) {
    return true
  }
  return PUBLIC_API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = api
      .post<{ token: string; refresh_token?: string }>('/token/refresh', { refresh_token: refreshToken })
      .then(({ data }) => {
        sessionStorage.setItem('lb_token', data.token)
        setAuthToken(data.token)
        if (data.refresh_token) {
          setStoredRefreshToken(data.refresh_token)
        }
        return data.token
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicApiRequest(originalRequest.url)
    ) {
      originalRequest._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api.request(originalRequest)
      }
    }

    if (error.response?.status === 401 && !isPublicApiRequest(error.config?.url)) {
      setAuthToken(null)
      sessionStorage.removeItem('lb_token')
      setStoredRefreshToken(null)
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign(`/login?redirect=${redirect}`)
      }
    }
    return Promise.reject(error)
  },
)

export { api }
