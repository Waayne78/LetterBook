import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
  /** Masque le titre quand la page d’accueil affiche déjà un hero */
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
    <div className={showPopularSidebar ? 'grid gap-8 lg:grid-cols-3' : 'space-y-6'}>
      <div className={showPopularSidebar ? 'space-y-6 lg:col-span-2' : 'space-y-6'}>
        {!embedded && (
          <div>
            <h1 className="text-3xl font-bold text-primary">{title}</h1>
            <p className="mt-1 text-slate-600">{subtitle}</p>
          </div>
        )}
        {embedded && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 px-1 py-1 backdrop-blur-sm">
            <h2 className="px-3 pt-2 text-lg font-bold text-primary">{title}</h2>
            <p className="px-3 pb-2 text-sm text-slate-600">{subtitle}</p>
          </div>
        )}

        {user && <FeedScopeTabs value={scope} onChange={setScope} />}

        {error === 'connect_required' && !user && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
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
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {showLoading && (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/80" />
            ))}
          </div>
        )}

        {!showLoading && !error && data?.items.length === 0 && (
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
        )}

        {!showLoading &&
          data?.items.map((item, idx) => (
            <FeedActivityCard
              key={`${item.type}-${item.at}-${item.user?.id ?? 0}-${idx}`}
              item={item}
              showFriendBadge={
                !!item.user?.id &&
                friendIds.has(item.user.id) &&
                (scope === 'following' || scope === 'friends')
              }
            />
          ))}
      </div>

      {showPopularSidebar && data && (
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-primary">Livres populaires</h2>
          <ul className="mt-4 space-y-3">
            {data.livresPopulaires.map((b, i) => (
              <li key={b.livreId ?? i} className="flex justify-between gap-2 text-sm">
                {b.livreId ? (
                  <Link to={`/books/${b.livreId}`} className="line-clamp-2 text-slate-800 hover:text-primary hover:underline">
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
