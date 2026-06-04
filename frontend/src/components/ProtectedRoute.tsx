import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProtectedRoute({
  children,
  adminOnly,
}: {
  children: ReactNode
  adminOnly?: boolean
}) {
  const { user, loading, token } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
        Chargement…
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !user.roles.includes('ROLE_ADMIN')) {
    return <Navigate to="/" replace />
  }

  return children
}
