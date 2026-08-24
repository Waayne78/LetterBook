import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Compass, UserCheck, UserPlus, Users } from 'lucide-react'
import { api } from '../api/client'
import { FollowButton } from '../components/social/FollowButton'
import { EmptyState } from '../components/ui/EmptyState'
import { UserAvatar } from '../components/ui/UserAvatar'
import { EmptyStateIconBook } from '../components/ui/emptyStateIcons'
import type { MeSocialResponse, PublicUser, SocialRelationship } from '../types/social'

const tabs = [
  { key: 'following', label: 'Abonnements', icon: UserPlus },
  { key: 'followers', label: 'Abonnés', icon: UserCheck },
  { key: 'friends', label: 'Amis', icon: Users },
] as const

type TabKey = (typeof tabs)[number]['key']

const tabDescriptions: Record<TabKey, string> = {
  following: 'Les lecteurs que vous suivez et dont l’activité apparaît dans votre fil.',
  followers: 'Les personnes qui s’intéressent à vos lectures et publications.',
  friends: 'Vos abonnements réciproques — le cercle de lecteurs les plus proches.',
}

function tabFromQuery(param: string | null): TabKey {
  if (param === 'following' || param === 'followers' || param === 'friends') {
    return param
  }
  return 'following'
}

function relationshipForUser(userId: number, tab: TabKey, friendIds: Set<number>): SocialRelationship {
  if (friendIds.has(userId)) {
    return 'friends'
  }
  if (tab === 'following') {
    return 'following'
  }
  if (tab === 'followers') {
    return 'follower'
  }
  return 'friends'
}

function relationshipLabel(relationship: SocialRelationship): string {
  switch (relationship) {
    case 'friends':
      return 'Ami mutuel'
    case 'following':
      return 'Abonnement actif'
    case 'follower':
      return 'Vous suit'
    case 'none':
      return 'Lecteur'
    default: {
      const _exhaustive: never = relationship
      return _exhaustive
    }
  }
}

const emptyCopy: Record<TabKey, { title: string; description: string }> = {
  following: {
    title: 'Aucun abonnement',
    description: 'Explorez la communauté et suivez des lecteurs qui partagent vos goûts.',
  },
  followers: {
    title: 'Aucun abonné',
    description: 'Publiez des avis et enrichissez votre profil pour attirer de nouveaux lecteurs.',
  },
  friends: {
    title: 'Pas encore d’amis',
    description: 'Devenez amis avec les personnes que vous suivez et qui vous suivent en retour.',
  },
}

function countForTab(data: MeSocialResponse | null, key: TabKey): number {
  if (!data) {
    return 0
  }
  if (key === 'following') {
    return data.counts.following
  }
  if (key === 'followers') {
    return data.counts.followers
  }
  return data.counts.friends
}

export function NetworkPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<MeSocialResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>(() => tabFromQuery(searchParams.get('tab')))
  const [error, setError] = useState<string | null>(null)

  const loadSocial = useCallback(() => {
    setLoading(true)
    setError(null)
    void api
      .get<MeSocialResponse>('/me/social')
      .then((res) => setData(res.data))
      .catch(() => setError('Impossible de charger votre réseau.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    loadSocial()
  }, [loadSocial])

  const friendIds = useMemo(
    () => new Set((data?.friends ?? []).map((u) => u.id)),
    [data?.friends],
  )

  const list = useMemo(() => {
    if (!data) {
      return []
    }
    if (tab === 'following') {
      return data.following
    }
    if (tab === 'followers') {
      return data.followers
    }
    return data.friends
  }, [data, tab])

  const totalConnections = (data?.counts.following ?? 0) + (data?.counts.followers ?? 0)

  function selectTab(next: TabKey) {
    setTab(next)
    navigate(`/network?tab=${next}`, { replace: true })
  }

  function handleRelationshipChange() {
    loadSocial()
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Mon réseau</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {loading ? (
              'Chargement de vos connexions…'
            ) : (
              <>
                <span className="font-medium text-slate-800">{data?.counts.friends ?? 0} ami{(data?.counts.friends ?? 0) !== 1 ? 's' : ''}</span>
                {' · '}
                {data?.counts.following ?? 0} abonnement{(data?.counts.following ?? 0) !== 1 ? 's' : ''}
                {' · '}
                {data?.counts.followers ?? 0} abonné{(data?.counts.followers ?? 0) !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Compass className="h-4 w-4" aria-hidden />
          Découvrir
        </Link>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div
          className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1"
          role="tablist"
          aria-label="Sections du réseau"
        >
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            const count = countForTab(data, t.key)
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(t.key)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:justify-center sm:gap-2 sm:px-4 ${
                  active
                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="text-xs font-semibold sm:text-sm">{t.label}</span>
                </span>
                <span
                  className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums sm:text-xs ${
                    active ? 'bg-primary/10 text-primary' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {loading ? '—' : count}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-sm text-slate-500">{tabDescriptions[tab]}</p>

        <div className="mt-5">
          {loading && (
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: 3 }).map((_, idx) => (
                <li key={idx} className="flex animate-pulse items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-48 max-w-full rounded bg-slate-100" />
                  </div>
                  <div className="hidden h-9 w-28 shrink-0 rounded-xl bg-slate-200 sm:block" />
                </li>
              ))}
            </ul>
          )}

          {!loading && list.length === 0 && (
            <EmptyState
              icon={<EmptyStateIconBook />}
              title={emptyCopy[tab].title}
              description={emptyCopy[tab].description}
              action={
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
                >
                  Parcourir les lecteurs
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              }
            />
          )}

          {!loading && list.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {list.map((u) => (
                <NetworkUserRow
                  key={u.id}
                  user={u}
                  relationship={relationshipForUser(u.id, tab, friendIds)}
                  onRelationshipChange={() => handleRelationshipChange()}
                />
              ))}
            </ul>
          )}
        </div>

        {!loading && totalConnections < 5 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-sm text-slate-600">
              Votre réseau grandit — trouvez de nouveaux lecteurs à suivre.
            </p>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Explorer la communauté
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

type NetworkUserRowProps = {
  user: PublicUser
  relationship: SocialRelationship
  onRelationshipChange: (relationship: SocialRelationship) => void
}

function NetworkUserRow({ user, relationship, onRelationshipChange }: NetworkUserRowProps) {
  const badgeClass =
    relationship === 'friends'
      ? 'bg-indigo-50 text-indigo-800 ring-indigo-100'
      : relationship === 'following'
        ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
        : 'bg-slate-100 text-slate-700 ring-slate-200'

  return (
    <li className="-mx-2 flex flex-col gap-3 rounded-xl px-2 py-4 transition first:pt-0 last:pb-0 hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <Link to={`/profiles/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar pseudo={user.pseudo} photo={user.photo} className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-900 hover:text-primary">@{user.pseudo}</p>
            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${badgeClass}`}
            >
              {relationshipLabel(relationship)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
            {user.bio ?? 'Passionné de lecture sur LetterBook'}
          </p>
        </div>
      </Link>
      <div className="shrink-0 pl-14 sm:pl-0">
        <FollowButton userId={user.id} relationship={relationship} onChange={onRelationshipChange} />
      </div>
    </li>
  )
}
