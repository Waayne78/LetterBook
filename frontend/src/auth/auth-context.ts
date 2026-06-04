import { createContext } from 'react'

export type UserMe = {
  id: number
  email: string
  pseudo: string
  roles: string[]
  photo: string | null
  bio: string | null
}

export type AuthContextValue = {
  token: string | null
  user: UserMe | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
