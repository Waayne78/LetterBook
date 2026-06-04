import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sparkles, Users } from 'lucide-react'
import { api } from '../api/client'
import { FollowButton } from '../components/social/FollowButton'
import { EmptyState } from '../components/ui/EmptyState'
import { UserAvatar } from '../components/ui/UserAvatar'
import { EmptyStateIconBook } from '../components/ui/emptyStateIcons'
import type { PublicUser, SocialRelationship } from '../types/social'

export function DiscoverPage() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSuggestions = useCallback(() => {
    setLoading(true)
    setError(null)
    void api
      .get<{ users: PublicUser[] }>('/users/suggestions')
      .then((res) => setUsers(res.data.users))
      .catch(() => setError('Impossible de charger les suggestions pour le moment.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  useEffect(() => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      loadSuggestions()
      return
    }
    const t = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      void api
        .get<{ users: PublicUser[] }>('/users/search', { params: { q: trimmed } })
        .then((res) => setUsers(res.data.users))
        .catch(() => setError('La recherche est indisponible. Réessayez dans un instant.'))
        .finally(() => setLoading(false))
    }, 300)
    return () => window.clearTimeout(t)
  }, [q, loadSuggestions])

  function updateRelationship(userId: number, relationship: SocialRelationship) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship } : u)))
  }

  const trimmedQ = q.trim()
  const title = useMemo(() => (trimmedQ.length >= 2 ? `Résultats pour “${trimmedQ}”` : 'Lecteurs recommandés'), [trimmedQ])

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-primary via-slate-900 to-indigo-950 p-6 text-primary-foreground shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            Réseau social
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Découvrir des lecteurs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            Cherchez des profils, abonnez-vous et devenez amis automatiquement dès que l’abonnement est réciproque.
          </p>
          <label className="mt-6 block" role="search">
            <span className="sr-only">Rechercher un lecteur</span>
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher par pseudo…"
                className="w-full rounded-2xl border border-white/20 bg-white/95 py-3 pl-12 pr-4 text-slate-900 shadow-lg shadow-slate-950/20 placeholder:text-slate-400 focus:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              />
            </div>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {users.length} lecteur{users.length > 1 ? 's' : ''}
          </span>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && users.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/profiles/${u.id}`} className="flex min-w-0 items-center gap-3">
                    <UserAvatar pseudo={u.pseudo} photo={u.photo} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 hover:text-primary">@{u.pseudo}</p>
                      <p className="text-xs text-slate-500">
                        {u.relationship === 'friends'
                          ? 'Vous êtes amis'
                          : u.relationship === 'following'
                            ? 'Vous êtes abonné'
                            : u.relationship === 'follower'
                              ? 'Vous suit déjà'
                              : 'Nouveau lecteur'}
                      </p>
                    </div>
                  </Link>
                  <FollowButton
                    userId={u.id}
                    relationship={u.relationship ?? 'none'}
                    onChange={(r) => updateRelationship(u.id, r)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && users.length === 0 && (
          <EmptyState
            icon={<EmptyStateIconBook />}
            title="Aucun lecteur trouvé"
            description="Essayez un autre pseudo ou revenez à vide pour voir les suggestions."
          />
        )}
      </section>
    </div>
  )
}
