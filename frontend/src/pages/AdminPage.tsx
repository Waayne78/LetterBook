import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/useToast'
import { tabButtonClass } from '../lib/tabStyles'

type AdminUser = {
  id: number
  pseudo: string
  email: string
  roles: string[]
  suspended: boolean
}

type AdminReportTarget = {
  type: 'avis' | 'commentaire'
  avis?: { id: number; contenu: string; note: number; livreId?: number | null }
  commentaire?: { id: number; contenu: string; avisId?: number | null }
  livreId?: number | null
  avisId?: number | null
}

type AdminReport = {
  id: number
  targetType: 'avis' | 'commentaire'
  targetTypeLabel: string
  targetId: number
  motif: string | null
  status: string
  statusLabel: string
  createdAt: string
  reporter?: { pseudo: string } | null
  target?: AdminReportTarget | null
}

type AdminTab = 'users' | 'reports'

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadUsers = useCallback(async () => {
    const { data } = await api.get<{ users: AdminUser[] }>('/admin/users')
    setUsers(data.users)
  }, [])

  const loadReports = useCallback(async () => {
    const { data } = await api.get<{ reports: AdminReport[] }>('/admin/reports?status=pending')
    setReports(data.reports)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (tab === 'users') {
        await loadUsers()
      } else {
        await loadReports()
      }
    } catch {
      setError('Accès refusé ou erreur serveur.')
    } finally {
      setLoading(false)
    }
  }, [tab, loadUsers, loadReports])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleSuspend(u: AdminUser) {
    try {
      await api.patch(`/admin/users/${u.id}/suspend`, { suspended: !u.suspended })
      await loadUsers()
    } catch {
      toast({ title: 'Action impossible', description: 'La suspension n’a pas pu être mise à jour.', variant: 'error' })
    }
  }

  async function dismissReport(reportId: number) {
    try {
      await api.patch(`/admin/reports/${reportId}`, { status: 'dismissed' })
      await loadReports()
    } catch {
      toast({ title: 'Action impossible', description: 'Le signalement n’a pas pu être rejeté.', variant: 'error' })
    }
  }

  async function resolveAndDeleteReport(report: AdminReport) {
    try {
      if (report.targetType === 'avis') {
        await api.delete(`/admin/avis/${report.targetId}`)
      } else {
        await api.delete(`/admin/comments/${report.targetId}`)
      }
      await loadReports()
    } catch {
      toast({ title: 'Action impossible', description: 'La modération a échoué.', variant: 'error' })
    }
  }

  function targetPreview(report: AdminReport): string {
    const target = report.target
    if (!target) {
      return 'Contenu indisponible'
    }
    if (target.type === 'avis') {
      return target.avis?.contenu ?? 'Avis'
    }
    return target.commentaire?.contenu ?? 'Commentaire'
  }

  function targetBookLink(report: AdminReport): string | null {
    const livreId = report.target?.livreId
    return livreId ? `/books/${livreId}` : null
  }

  const emptyUsers = !loading && !error && tab === 'users' && users.length === 0
  const emptyReports = !loading && !error && tab === 'reports' && reports.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Administration</h1>
        <p className="text-slate-600">Gestion des utilisateurs et modération des contenus signalés.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'users'} className={tabButtonClass(tab === 'users')} onClick={() => setTab('users')}>
          Utilisateurs
        </button>
        <button type="button" role="tab" aria-selected={tab === 'reports'} className={tabButtonClass(tab === 'reports')} onClick={() => setTab('reports')}>
          Signalements
        </button>
      </div>

      {loading && <p className="text-slate-600">Chargement…</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {emptyUsers && (
        <EmptyState title="Aucun utilisateur" description="La liste des comptes apparaîtra ici une fois des membres inscrits." />
      )}

      {emptyReports && (
        <EmptyState title="Aucun signalement en attente" description="Les contenus signalés par la communauté apparaîtront ici." />
      )}

      {!loading && !error && tab === 'users' && users.length > 0 && (
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
                      className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-95"
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

      {!loading && !error && tab === 'reports' && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => {
            const bookLink = targetBookLink(report)
            return (
              <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {report.targetTypeLabel} · signalé par {report.reporter?.pseudo ?? '—'}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-800">{targetPreview(report)}</p>
                    {report.motif && <p className="mt-2 text-xs text-slate-500">Motif : {report.motif}</p>}
                    {bookLink && (
                      <Link to={bookLink} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                        Voir la fiche livre
                      </Link>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void dismissReport(report.id)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Rejeter
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveAndDeleteReport(report)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Supprimer le contenu
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
