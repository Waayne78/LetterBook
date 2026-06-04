import { Link } from 'react-router-dom'
import { Flame, TrendingUp, UserPlus } from 'lucide-react'
import type { FeedResponse } from '../../types/feed'
import type { PublicUser } from '../../types/social'
import { UserAvatar } from '../ui/UserAvatar'

type HomeSidebarProps = {
  feedPreview: FeedResponse | null
  suggestions: PublicUser[]
}

export function HomeSidebar({ feedPreview, suggestions }: HomeSidebarProps) {
  const popular = feedPreview?.livresPopulaires?.slice(0, 5) ?? []

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" aria-hidden />
            <h2 className="font-semibold text-primary">Livres populaires</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted">Les plus commentés sur LetterBook</p>
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
          <Link to="/feed" className="text-sm font-semibold text-link hover:underline">
            Voir tout le fil →
          </Link>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" aria-hidden />
            <h2 className="font-semibold text-primary">Lecteurs à découvrir</h2>
          </div>
          <ul className="mt-4 space-y-2">
            {suggestions.slice(0, 5).map((u) => (
              <li key={u.id}>
                <Link
                  to={`/profiles/${u.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  <UserAvatar pseudo={u.pseudo} photo={u.photo} className="h-9 w-9" textClassName="text-xs" />
                  <span className="text-sm font-medium text-slate-800">@{u.pseudo}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/discover"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Explorer →
          </Link>
        </section>
      )}

      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-accent-soft/50 p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
          <div>
            <h2 className="font-semibold text-primary">Conseil du jour</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Abonnez-vous à des lecteurs : dès qu’ils vous suivent en retour, vous devenez amis et leur activité
              apparaît dans l’onglet « Amis ».
            </p>
            <Link
              to="/discover"
              className="mt-3 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Trouver des lecteurs
            </Link>
          </div>
        </div>
      </section>
    </aside>
  )
}
