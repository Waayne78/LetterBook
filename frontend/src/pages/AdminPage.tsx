import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/ui/EmptyState'

type AdminUser = {
  id: number
  pseudo: string
  email: string
  roles: string[]
  suspended: boolean
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<{ users: AdminUser[] }>('/admin/users')
      setUsers(data.users)
    } catch {
      setError('Accès refusé ou erreur serveur.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggleSuspend(u: AdminUser) {
    await api.patch(`/admin/users/${u.id}/suspend`, { suspended: !u.suspended })
    await load()
  }

  const empty = !loading && !error && users.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Administration</h1>
        <p className="text-slate-600">Gestion des utilisateurs (modération).</p>
      </div>

      {loading && <p className="text-slate-600">Chargement…</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {empty && (
        <EmptyState
          title="Aucun utilisateur"
          description="La liste des comptes apparaîtra ici une fois des membres inscrits."
        />
      )}

      {!loading && !error && users.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Pseudo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Rôles</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.pseudo}</td>
                  <td className="px-4 py-3 text-slate-700">{u.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{u.roles.join(', ')}</td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">Suspendu</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Actif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void toggleSuspend(u)}
                      className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {u.suspended ? 'Réactiver' : 'Suspendre'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
