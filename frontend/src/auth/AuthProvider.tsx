import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getStoredToken, setAuthToken, setStoredRefreshToken } from '../api/client'
import { clearCsrfToken, getCsrfToken } from '../lib/csrf'
import { AuthContext, type UserMe } from './auth-context'

type LoginResponse = {
  token: string
  refresh_token?: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    const t = getStoredToken()
    setAuthToken(t)
    if (!t) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get<UserMe>('/me')
      setUser(data)
    } catch {
      setUser(null)
      sessionStorage.removeItem('lb_token')
      setStoredRefreshToken(null)
      setAuthToken(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  const login = useCallback(
    async (email: string, password: string) => {
      const csrfToken = await getCsrfToken()
      const { data } = await api.post<LoginResponse>(
        '/login',
        { email, password },
        { headers: { 'X-CSRF-Token': csrfToken } },
      )
      sessionStorage.setItem('lb_token', data.token)
      if (data.refresh_token) {
        setStoredRefreshToken(data.refresh_token)
      }
      setToken(data.token)
      setAuthToken(data.token)
      await refreshMe()
    },
    [refreshMe],
  )

  const logout = useCallback(() => {
    sessionStorage.removeItem('lb_token')
    setStoredRefreshToken(null)
    clearCsrfToken()
    setToken(null)
    setUser(null)
    setAuthToken(null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      refreshMe,
    }),
    [token, user, loading, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
