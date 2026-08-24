import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Flag, Heart, MessageCircle } from 'lucide-react'
import { formatRelativeDate } from '../../lib/formatRelativeDate'
import type { BookReview } from '../../types/bookDetail'
import { UserAvatar } from '../ui/UserAvatar'
import { useToast } from '../ui/useToast'
import { RatingStars } from './RatingStars'

const COMMENT_MAX_LENGTH = 500

type ReviewCardProps = {
  review: BookReview
  isLoggedIn: boolean
  commentDraft: string
  onCommentDraftChange: (value: string) => void
  onToggleLike: () => void
  onSendComment: () => void
  onReportReview: () => Promise<void>
  onReportComment: (commentId: number) => Promise<void>
}

export function ReviewCard({
  review,
  isLoggedIn,
  commentDraft,
  onCommentDraftChange,
  onToggleLike,
  onSendComment,
  onReportReview,
  onReportComment,
}: ReviewCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const { toast } = useToast()
  const pseudo = review.user?.pseudo ?? 'Lecteur'
  const profileId = review.user?.id
  const commentCount = review.commentsCount ?? review.commentaires?.length ?? 0

  async function handleReportReview() {
    if (!window.confirm('Signaler cet avis comme inapproprié ?')) {
      return
    }
    try {
      await onReportReview()
      toast({ title: 'Avis signalé', description: 'Merci pour votre vigilance.' })
    } catch {
      toast({ title: 'Signalement impossible', variant: 'error' })
    }
  }

  async function handleReportComment(commentId: number) {
    if (!window.confirm('Signaler ce commentaire comme inapproprié ?')) {
      return
    }
    try {
      await onReportComment(commentId)
      toast({ title: 'Commentaire signalé', description: 'Merci pour votre vigilance.' })
    } catch {
      toast({ title: 'Signalement impossible', variant: 'error' })
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <UserAvatar pseudo={pseudo} photo={review.user?.photo} className="h-10 w-10 shrink-0" textClassName="text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {profileId ? (
              <Link
                to={`/profiles/${profileId}`}
                className="font-semibold text-slate-900 hover:text-primary hover:underline"
              >
                {pseudo}
              </Link>
            ) : (
              <p className="font-semibold text-slate-900">{pseudo}</p>
            )}
            {review.datePublication && (
              <time className="text-xs text-muted" dateTime={review.datePublication}>
                {formatRelativeDate(review.datePublication)}
              </time>
            )}
          </div>
          <div className="mt-1">
            <RatingStars value={review.note} size="sm" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.contenu}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 ${
                review.likedByMe ? 'text-accent' : 'text-link hover:underline'
              }`}
              onClick={onToggleLike}
              disabled={!isLoggedIn}
              title={isLoggedIn ? 'J’aime' : 'Connectez-vous pour aimer'}
            >
              <Heart className={`h-4 w-4 ${review.likedByMe ? 'fill-accent text-accent' : ''}`} aria-hidden />
              {review.likesCount ?? 0}
            </button>
            <button
              type="button"
              onClick={() => setCommentsOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-primary"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {commentCount} commentaire{commentCount !== 1 ? 's' : ''}
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${commentsOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => void handleReportReview()}
                className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-red-600"
                title="Signaler cet avis"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden />
                Signaler
              </button>
            )}
          </div>

          {commentsOpen && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              {(review.commentaires?.length ?? 0) > 0 && (
                <ul className="mb-4 space-y-2">
                  {review.commentaires?.map((c) => (
                    <li key={c.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {c.user?.id ? (
                            <Link
                              to={`/profiles/${c.user.id}`}
                              className="font-medium text-slate-800 hover:text-primary"
                            >
                              {c.user.pseudo}
                            </Link>
                          ) : (
                            <p className="font-medium text-slate-800">{c.user?.pseudo ?? 'Lecteur'}</p>
                          )}
                          <p className="mt-0.5 text-slate-600">{c.contenu}</p>
                          {c.datePublication && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              {formatRelativeDate(c.datePublication)}
                            </p>
                          )}
                        </div>
                        {isLoggedIn && (
                          <button
                            type="button"
                            onClick={() => void handleReportComment(c.id)}
                            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-red-600"
                            title="Signaler ce commentaire"
                          >
                            <Flag className="h-3 w-3" aria-hidden />
                            Signaler
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {isLoggedIn && (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      value={commentDraft}
                      onChange={(e) => onCommentDraftChange(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                      maxLength={COMMENT_MAX_LENGTH}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      placeholder="Ajouter un commentaire"
                    />
                    <button
                      type="button"
                      onClick={onSendComment}
                      disabled={!commentDraft.trim()}
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                  </div>
                  <p className="text-right text-[10px] text-slate-400">
                    {commentDraft.length}/{COMMENT_MAX_LENGTH}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
