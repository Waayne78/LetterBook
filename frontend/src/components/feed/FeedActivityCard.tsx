import { BookMarked, MessageSquareQuote } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatRelativeDate } from '../../lib/formatRelativeDate'
import type { FeedItem } from '../../types/feed'
import { RatingStars } from '../bookDetail/RatingStars'
import { UserAvatar } from '../ui/UserAvatar'

type FeedActivityCardProps = {
  item: FeedItem
  showFriendBadge?: boolean
}

function activityMeta(item: FeedItem): { actionLabel: string; icon: ReactNode } {
  switch (item.type) {
    case 'review':
      return {
        actionLabel: 'a publié un avis',
        icon: (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden />
          </span>
        ),
      }
    case 'library_add':
      return {
        actionLabel: 'a ajouté à sa bibliothèque',
        icon: (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookMarked className="h-3.5 w-3.5" aria-hidden />
          </span>
        ),
      }
    case 'library_status':
      return {
        actionLabel: `a mis à jour : ${item.statutLabel}`,
        icon: (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookMarked className="h-3.5 w-3.5" aria-hidden />
          </span>
        ),
      }
    default: {
      const _exhaustive: never = item
      return _exhaustive
    }
  }
}

export function FeedActivityCard({ item, showFriendBadge }: FeedActivityCardProps) {
  const user = item.user
  const pseudo = user?.pseudo ?? 'Lecteur'
  const profileId = user?.id
  const { actionLabel, icon } = activityMeta(item)

  const livre = item.livre
  const bookLink = livre?.id != null ? `/books/${livre.id}` : null

  return (
    <article className="rounded-2xl px-3 py-4 transition hover:bg-slate-50/80 sm:px-4">
      <div className="flex gap-3">
        {profileId ? (
          <Link
            to={`/profiles/${profileId}`}
            className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <UserAvatar pseudo={pseudo} photo={user?.photo} className="h-10 w-10" textClassName="text-sm" />
          </Link>
        ) : (
          <div className="h-10 w-10 shrink-0">
            <UserAvatar pseudo={pseudo} photo={user?.photo} className="h-10 w-10" textClassName="text-sm" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-snug">
                {icon}
                {profileId ? (
                  <Link
                    to={`/profiles/${profileId}`}
                    className="font-semibold text-slate-900 hover:text-primary"
                  >
                    {pseudo}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">{pseudo}</span>
                )}
                <span className="text-slate-500">{actionLabel}</span>
                {showFriendBadge && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                    Ami
                  </span>
                )}
              </p>
            </div>
            <time className="shrink-0 pt-0.5 text-xs text-slate-400" dateTime={item.at}>
              {formatRelativeDate(item.at)}
            </time>
          </div>

          {livre && (
            <div className="mt-3 flex gap-3 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-inset ring-slate-200/70">
              {livre.couverture && (
                bookLink ? (
                  <Link to={bookLink} className="shrink-0">
                    <img
                      src={livre.couverture}
                      alt=""
                      className="h-[4.5rem] w-12 rounded-md object-cover shadow-sm ring-1 ring-black/5"
                    />
                  </Link>
                ) : (
                  <img
                    src={livre.couverture}
                    alt=""
                    className="h-[4.5rem] w-12 shrink-0 rounded-md object-cover shadow-sm ring-1 ring-black/5"
                  />
                )
              )}
              <div className="min-w-0 flex-1">
                {bookLink ? (
                  <Link
                    to={bookLink}
                    className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-primary"
                  >
                    {livre.titre}
                  </Link>
                ) : (
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{livre.titre}</p>
                )}
                <p className="mt-0.5 text-xs text-slate-500">{livre.auteur}</p>

                {item.type === 'review' && (
                  <div className="mt-2 space-y-1">
                    <RatingStars value={item.avis.note} size="sm" />
                    {item.avis.contenu.trim() !== '' && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-slate-700">
                        {item.avis.contenu}
                      </p>
                    )}
                  </div>
                )}

                {item.type !== 'review' && (
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    {item.statutLabel}
                    {item.progression != null && item.statut === 'en_cours'
                      ? ` · ${item.progression} %`
                      : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
