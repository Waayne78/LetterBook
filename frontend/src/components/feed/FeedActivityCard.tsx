import { Link } from 'react-router-dom'
import { BookMarked, BookOpen, MessageSquareQuote } from 'lucide-react'
import { formatRelativeDate } from '../../lib/formatRelativeDate'
import { RatingStars } from '../bookDetail/RatingStars'
import { UserAvatar } from '../ui/UserAvatar'
import type { FeedItem } from '../../types/feed'

type FeedActivityCardProps = {
  item: FeedItem
  showFriendBadge?: boolean
}

export function FeedActivityCard({ item, showFriendBadge }: FeedActivityCardProps) {
  const user = item.user
  const pseudo = user?.pseudo ?? 'Lecteur'
  const profileId = user?.id

  let actionLabel = ''
  let icon = <BookOpen className="h-4 w-4 text-primary" aria-hidden />

  if (item.type === 'review') {
    actionLabel = 'a publié un avis'
    icon = <MessageSquareQuote className="h-4 w-4 text-accent" aria-hidden />
  } else if (item.type === 'library_add') {
    actionLabel = 'a ajouté à sa bibliothèque'
    icon = <BookMarked className="h-4 w-4 text-primary" aria-hidden />
  } else {
    actionLabel = `a mis à jour : ${item.statutLabel}`
    icon = <BookMarked className="h-4 w-4 text-primary" aria-hidden />
  }

  const livre = item.livre
  const bookLink = livre?.id != null ? `/books/${livre.id}` : null

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex gap-3">
        {profileId ? (
          <Link
            to={`/profiles/${profileId}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary hover:ring-2 hover:ring-primary/30"
          >
            <UserAvatar pseudo={pseudo} photo={user?.photo} className="h-10 w-10" textClassName="text-sm" />
          </Link>
        ) : (
          <div className="h-10 w-10 shrink-0">
            <UserAvatar pseudo={pseudo} photo={user?.photo} className="h-10 w-10" textClassName="text-sm" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {icon}
            {profileId ? (
              <Link to={`/profiles/${profileId}`} className="font-semibold text-slate-900 hover:text-primary">
                {pseudo}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900">{pseudo}</span>
            )}
            <span className="text-slate-600">{actionLabel}</span>
            {showFriendBadge && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-800">
                Ami
              </span>
            )}
            <time className="ml-auto text-xs text-muted" dateTime={item.at}>
              {formatRelativeDate(item.at)}
            </time>
          </div>

          {livre && (
            <div className="mt-3 flex gap-3 rounded-xl bg-slate-50/80 p-3">
              {livre.couverture && bookLink && (
                <Link to={bookLink} className="shrink-0">
                  <img
                    src={livre.couverture}
                    alt=""
                    className="h-20 w-14 rounded-lg object-cover shadow-sm ring-1 ring-slate-200"
                  />
                </Link>
              )}
              <div className="min-w-0">
                {bookLink ? (
                  <Link to={bookLink} className="line-clamp-2 font-semibold text-primary hover:underline">
                    {livre.titre}
                  </Link>
                ) : (
                  <p className="line-clamp-2 font-semibold text-primary">{livre.titre}</p>
                )}
                <p className="mt-0.5 text-xs text-muted">{livre.auteur}</p>
                {item.type === 'review' && (
                  <div className="mt-2 flex items-center gap-2">
                    <RatingStars value={item.avis.note} size="sm" />
                    <p className="line-clamp-3 text-sm text-slate-700">{item.avis.contenu}</p>
                  </div>
                )}
                {item.type !== 'review' && (
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    Statut : {item.statutLabel}
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
