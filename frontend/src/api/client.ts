import axios, { type AxiosError } from 'axios'

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

const PUBLIC_API_PREFIXES = ['/login', '/register', '/feed', '/books/search', '/books/']

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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !isPublicApiRequest(error.config?.url)) {
      setAuthToken(null)
      sessionStorage.removeItem('lb_token')
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign(`/login?redirect=${redirect}`)
      }
    }
    return Promise.reject(error)
  },
)

export { api }
