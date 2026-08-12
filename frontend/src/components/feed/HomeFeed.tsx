import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { useFeed } from '../../hooks/useFeed'
import type { FeedScope } from '../../types/feed'
import type { MeSocialResponse } from '../../types/social'
import { EmptyState } from '../ui/EmptyState'
import { EmptyStateIconChat } from '../ui/emptyStateIcons'
import { FeedActivityCard } from './FeedActivityCard'
import { FeedScopeTabs } from './FeedScopeTabs'

type HomeFeedProps = {
  showPopularSidebar?: boolean
  embedded?: boolean
  title?: string
  subtitle?: string
}

export function HomeFeed({
  showPopularSidebar = false,
  embedded = false,
  title = 'Fil d’actualité',
  subtitle = 'Suivez des lecteurs pour voir leurs avis et lectures.',
}: HomeFeedProps) {
  const { user, loading: authLoading } = useAuth()
  const [scope, setScope] = useState<FeedScope>(user ? 'following' : 'community')
  const feedReady = scope === 'community' || (!authLoading && !!user)
  const { data, error, loading } = useFeed(scope, feedReady)
  const showLoading = loading || (authLoading && scope !== 'community')
  const [social, setSocial] = useState<MeSocialResponse | null>(null)

  useEffect(() => {
    if (!user) {
      setSocial(null)
      return
    }
    void api.get<MeSocialResponse>('/me/social').then((res) => setSocial(res.data)).catch(() => setSocial(null))
  }, [user])

  const friendIds = new Set(social?.friends.map((f) => f.id) ?? [])

  return (
    <div className={showPopularSidebar ? 'grid gap-8 lg:grid-cols-3' : undefined}>
      <section
        className={`overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${
          showPopularSidebar ? 'lg:col-span-2' : ''
        }`}
        aria-label={title}
      >
        <header className="relative px-5 pb-1 pt-5 sm:px-7 sm:pt-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-orange-50/50 to-transparent" aria-hidden />
          <div className="relative flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Newspaper className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                className={`font-display font-normal tracking-tight text-slate-900 ${
                  embedded ? 'text-2xl' : 'text-3xl'
                }`}
              >
                {title}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
            </div>
          </div>

          {user && (
            <div className="relative mt-5">
              <FeedScopeTabs value={scope} onChange={setScope} />
            </div>
          )}
        </header>

        <div className="px-2 pb-2 pt-3 sm:px-3 sm:pb-3">
          {error === 'connect_required' && !user && (
            <div className="m-3 rounded-2xl bg-slate-50 px-5 py-8 text-center">
              <p className="text-slate-600">Connectez-vous pour voir ce fil.</p>
              <Link
                to="/login"
                className="mt-3 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
              >
                Se connecter
              </Link>
            </div>
          )}

          {error && error !== 'connect_required' && (
            <p className="mx-3 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {showLoading && (
            <div className="space-y-2 px-2" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          )}

          {!showLoading && !error && data?.items.length === 0 && (
            <div className="px-2 pb-4">
              <EmptyState
                icon={<EmptyStateIconChat />}
                title={
                  scope === 'following'
                    ? 'Votre fil est vide'
                    : scope === 'friends'
                      ? 'Aucune activité d’amis'
                      : 'Aucune activité'
                }
                description={
                  scope === 'following'
                    ? 'Abonnez-vous à des lecteurs pour voir leur activité ici.'
                    : scope === 'friends'
                      ? 'Vous n’avez pas encore d’amis. Devenez amis quand vous vous abonnez mutuellement.'
                      : 'Revenez plus tard pour découvrir les derniers avis.'
                }
                action={
                  user && scope !== 'community' ? (
                    <Link
                      to="/discover"
                      className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      Découvrir des lecteurs
                    </Link>
                  ) : undefined
                }
              />
            </div>
          )}

          {!showLoading && data && data.items.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {data.items.map((item, idx) => (
                <li key={`${item.type}-${item.at}-${item.user?.id ?? 0}-${idx}`}>
                  <FeedActivityCard
                    item={item}
                    showFriendBadge={
                      !!item.user?.id &&
                      friendIds.has(item.user.id) &&
                      (scope === 'following' || scope === 'friends')
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {showPopularSidebar && data && (
        <aside className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:col-span-1">
          <h2 className="text-lg font-semibold text-primary">Livres populaires</h2>
          <ul className="mt-4 space-y-3">
            {data.livresPopulaires.map((b, i) => (
              <li key={b.livreId ?? i} className="flex justify-between gap-2 text-sm">
                {b.livreId ? (
                  <Link
                    to={`/books/${b.livreId}`}
                    className="line-clamp-2 text-slate-800 hover:text-primary hover:underline"
                  >
                    {b.titre}
                  </Link>
                ) : (
                  <span className="line-clamp-2 text-slate-800">{b.titre}</span>
                )}
                <span className="shrink-0 text-muted">{b.cnt} avis</span>
              </li>
            ))}
            {data.livresPopulaires.length === 0 && (
              <li className="text-sm text-muted">Pas encore de données.</li>
            )}
          </ul>
        </aside>
      )}
    </div>
  )
}
