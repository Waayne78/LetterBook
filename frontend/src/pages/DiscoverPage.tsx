import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Flame,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react'
import { api } from '../api/client'
import { FollowButton } from '../components/social/FollowButton'
import { EmptyState } from '../components/ui/EmptyState'
import { UserAvatar } from '../components/ui/UserAvatar'
import type { FeedResponse } from '../types/feed'
import type { MeSocialResponse, PublicUser, SocialRelationship } from '../types/social'

function relationshipLabel(relationship: SocialRelationship): string {
  switch (relationship) {
    case 'friends':
      return 'Ami mutuel'
    case 'following':
      return 'Abonnement actif'
    case 'follower':
      return 'Vous suit'
    case 'none':
      return 'Nouveau lecteur'
    default: {
      const _exhaustive: never = relationship
      return _exhaustive
    }
  }
}

function relationshipBadgeClass(relationship: SocialRelationship): string {
  switch (relationship) {
    case 'friends':
      return 'bg-indigo-50 text-indigo-800 ring-indigo-100'
    case 'following':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-100'
    case 'follower':
      return 'bg-amber-50 text-amber-800 ring-amber-100'
    case 'none':
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    default: {
      const _exhaustive: never = relationship
      return _exhaustive
    }
  }
}

export function DiscoverPage() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<PublicUser[]>([])
  const [social, setSocial] = useState<MeSocialResponse | null>(null)
  const [feedPreview, setFeedPreview] = useState<FeedResponse | null>(null)
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
    void api.get<MeSocialResponse>('/me/social').then((res) => setSocial(res.data)).catch(() => setSocial(null))
    void api
      .get<FeedResponse>('/feed', { params: { scope: 'community' } })
      .then((res) => setFeedPreview(res.data))
      .catch(() => setFeedPreview(null))
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
    void api.get<MeSocialResponse>('/me/social').then((res) => setSocial(res.data)).catch(() => undefined)
  }

  const trimmedQ = q.trim()
  const isSearchMode = trimmedQ.length >= 2
  const title = isSearchMode ? `Résultats pour « ${trimmedQ} »` : 'Lecteurs recommandés'

  const popular = feedPreview?.livresPopulaires?.slice(0, 5) ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50/50 px-5 py-5 md:px-6">
            <label className="block" role="search">
              <span className="text-sm font-semibold text-slate-800">Rechercher un compte</span>
              <div className="relative mt-2.5">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un compte…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
              {trimmedQ.length === 1 && (
                <p className="mt-2 text-xs text-slate-500">
                  Saisissez au moins 2 caractères pour lancer la recherche.
                </p>
              )}
            </label>
          </div>

          <div className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    isSearchMode
                      ? 'bg-primary/10 text-primary ring-primary/15'
                      : 'bg-accent/10 text-accent ring-accent/20'
                  }`}
                >
                  {isSearchMode ? (
                    <Search className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {isSearchMode ? 'Recherche' : 'Suggestions'}
                </span>
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                {!loading && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-slate-600">
                    {users.length}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {!loading && isSearchMode && (
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    className="text-sm font-semibold text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  >
                    Effacer
                  </button>
                )}
                <Link
                  to="/network"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  Mon réseau
                </Link>
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {isSearchMode
                ? 'Comptes correspondant à votre recherche.'
                : 'Profils sélectionnés pour enrichir votre fil de lecture.'}
            </p>

            <div className="mt-5">
              {error && (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {loading && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50">
                  <ul className="divide-y divide-slate-100">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <li key={idx} className="flex animate-pulse items-center gap-4 px-4 py-4">
                        <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-32 rounded bg-slate-200" />
                          <div className="h-3 w-48 max-w-full rounded bg-slate-100" />
                        </div>
                        <div className="hidden h-9 w-28 shrink-0 rounded-xl bg-slate-200 sm:block" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!loading && users.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40">
                  <ul className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <DiscoverUserRow
                        key={u.id}
                        user={u}
                        onRelationshipChange={(r) => updateRelationship(u.id, r)}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {!loading && users.length === 0 && (
                <EmptyState
                  icon={<UserRound className="h-6 w-6" strokeWidth={1.5} aria-hidden />}
                  title={isSearchMode ? 'Aucun compte trouvé' : 'Pas de suggestions pour le moment'}
                  description={
                    isSearchMode
                      ? `Aucun compte ne correspond à « ${trimmedQ} ». Essayez un autre pseudo.`
                      : 'Utilisez la recherche pour trouver un compte par pseudo.'
                  }
                  action={
                    isSearchMode ? (
                      <button
                        type="button"
                        onClick={() => setQ('')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Voir les suggestions
                      </button>
                    ) : (
                      <Link
                        to="/network"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        Voir mon réseau
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    )
                  }
                />
              )}
            </div>

            {!loading && !isSearchMode && users.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-gradient-to-r from-slate-50/90 to-orange-50/30 px-4 py-3.5">
                <p className="text-sm text-slate-600">
                  Vous connaissez déjà quelqu’un ? Tapez son pseudo dans la barre de recherche.
                </p>
                <Link
                  to="/feed"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Voir le fil
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-slate-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="font-semibold text-primary">Votre réseau</h2>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <SidebarStat label="Abonnements" value={social?.counts.following ?? 0} />
              <SidebarStat label="Abonnés" value={social?.counts.followers ?? 0} />
              <SidebarStat label="Amis" value={social?.counts.friends ?? 0} />
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Link
                to="/network"
                className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline"
              >
                Gérer mon réseau
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-accent" aria-hidden />
                <h2 className="font-semibold text-primary">Livres populaires</h2>
              </div>
              <p className="mt-0.5 text-xs text-muted">Les plus commentés en ce moment</p>
            </div>
            <ol className="divide-y divide-slate-100 px-2 py-2">
              {popular.map((b, i) => (
                <li key={b.livreId ?? i}>
                  {b.livreId ? (
                    <Link
                      to={`/books/${b.livreId}`}
                      className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-slate-900">{b.titre}</p>
                        <p className="mt-0.5 text-xs text-muted">{b.cnt} avis</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl px-3 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-slate-900">{b.titre}</p>
                        <p className="mt-0.5 text-xs text-muted">{b.cnt} avis</p>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {popular.length === 0 && (
                <li className="px-3 py-4 text-sm text-muted">Pas encore assez d’avis.</li>
              )}
            </ol>
            <div className="border-t border-slate-100 px-5 py-3">
              <Link to="/search" className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                Explorer les livres
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-orange-50/40 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
              <div>
                <h2 className="font-semibold text-primary">Pourquoi s’abonner ?</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Suivez des lecteurs pour voir leurs avis et lectures dans votre fil d’actualité.
                </p>
                <Link
                  to="/feed"
                  className="mt-3 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
                >
                  Ouvrir le fil
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function SidebarStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2 py-3 text-center">
      <p className="text-lg font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">{label}</p>
    </div>
  )
}

function DiscoverUserRow({
  user,
  onRelationshipChange,
}: {
  user: PublicUser
  onRelationshipChange: (relationship: SocialRelationship) => void
}) {
  const relationship = user.relationship ?? 'none'

  return (
    <li className="flex flex-col gap-3 bg-white px-4 py-4 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <Link to={`/profiles/${user.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar
          pseudo={user.pseudo}
          photo={user.photo}
          className="h-12 w-12 shrink-0 ring-2 ring-slate-100 transition group-hover:ring-primary/20"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-900 group-hover:text-primary">@{user.pseudo}</p>
            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${relationshipBadgeClass(relationship)}`}
            >
              {relationshipLabel(relationship)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {user.bio ?? 'Passionné de lecture sur LetterBook'}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-link opacity-0 transition group-hover:opacity-100 sm:opacity-100">
            Voir le profil
            <ArrowRight className="h-3 w-3" aria-hidden />
          </span>
        </div>
      </Link>
      <div className="shrink-0 pl-[3.75rem] sm:pl-0">
        <FollowButton userId={user.id} relationship={relationship} onChange={onRelationshipChange} />
      </div>
    </li>
  )
}
