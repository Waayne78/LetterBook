import { type ReactNode, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, MessageSquareQuote, Settings, UserPlus, Users } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { RatingStars } from '../components/bookDetail/RatingStars'
import { FollowButton } from '../components/social/FollowButton'
import { EmptyState } from '../components/ui/EmptyState'
import { UserAvatar } from '../components/ui/UserAvatar'
import { EmptyStateIconBook, EmptyStateIconChat } from '../components/ui/emptyStateIcons'
import { formatRelativeDate } from '../lib/formatRelativeDate'
import type { ProfileSocial } from '../types/social'

type ProfilePayload = {
  user: { id: number; pseudo: string; bio: string | null; photo: string | null; dateCreation: string }
  stats: { livresBibliotheque: number; avis: number }
  social?: ProfileSocial
  historiqueLecture: Array<{
    id: number
    livre: { id: number; titre: string; auteur: string; couverture: string | null } | null
  }>
  derniersAvis: Array<{
    id: number
    note: number
    contenu: string
    datePublication?: string
    livreId?: number | null
    livre?: { id: number; titre: string; auteur: string; couverture: string | null } | null
  }>
}

export function ProfilePage() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const [data, setData] = useState<ProfilePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!id) {
        return
      }
      try {
        const { data: res } = await api.get<ProfilePayload>(`/profiles/${id}`)
        if (!cancelled) {
          setData(res)
        }
      } catch {
        if (!cancelled) {
          setError('Profil introuvable.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
  }

  if (!data) {
    return <p className="text-slate-600">Chargement…</p>
  }

  const historiqueEmpty = data.historiqueLecture.length === 0
  const avisEmpty = data.derniersAvis.length === 0
  const isOwnProfile = me !== null && id !== undefined && me.id === Number(id)
  const memberSince = new Date(data.user.dateCreation).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <UserAvatar
                pseudo={data.user.pseudo}
                photo={data.user.photo}
                className="h-20 w-20 shrink-0 ring-2 ring-slate-100 md:h-24 md:w-24"
                textClassName="text-2xl"
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  @{data.user.pseudo}
                </h1>
                <p className="mt-1 text-sm text-slate-500">Membre depuis {memberSince}</p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                  {data.user.bio || 'Ce lecteur n’a pas encore ajouté de bio.'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 sm:pt-1">
              {!isOwnProfile && data.social && id && (
                <FollowButton
                  userId={Number(id)}
                  relationship={data.social.relationship}
                  onChange={(r) =>
                    setData((prev) =>
                      prev && prev.social ? { ...prev, social: { ...prev.social, relationship: r } } : prev,
                    )
                  }
                />
              )}
              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Settings className="h-4 w-4" aria-hidden />
                  Paramètres
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
          <ProfileStatItem
            label="Livres suivis"
            value={data.stats.livresBibliotheque}
            icon={<BookOpen className="h-4 w-4" aria-hidden />}
          />
          <ProfileStatItem
            label="Avis publiés"
            value={data.stats.avis}
            icon={<MessageSquareQuote className="h-4 w-4" aria-hidden />}
          />
          {data.social && (
            <>
              <ProfileStatItem
                label="Abonnés"
                value={data.social.followersCount}
                icon={<Users className="h-4 w-4" aria-hidden />}
                to={isOwnProfile ? '/network?tab=followers' : undefined}
              />
              <ProfileStatItem
                label="Abonnements"
                value={data.social.followingCount}
                icon={<UserPlus className="h-4 w-4" aria-hidden />}
                to={isOwnProfile ? '/network?tab=following' : undefined}
              />
              <ProfileStatItem
                label="Amis"
                value={data.social.friendsCount}
                icon={<Users className="h-4 w-4" aria-hidden />}
                to={isOwnProfile ? '/network?tab=friends' : undefined}
              />
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary">Historique de lecture</h2>
            <Link
              to="/library"
              className="rounded-sm text-sm font-semibold text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Bibliothèque
            </Link>
          </div>
          {historiqueEmpty ? (
            <EmptyState
              icon={<EmptyStateIconBook />}
              title="Aucun livre dans l’historique"
              description={
                isOwnProfile
                  ? 'Les livres ajoutés à votre bibliothèque apparaîtront ici.'
                  : 'Ce membre n’a pas encore de livres dans sa bibliothèque.'
              }
              action={
                isOwnProfile ? (
                  <Link
                    to="/library"
                    className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    Ouvrir ma bibliothèque
                  </Link>
                ) : (
                  <Link
                    to="/feed"
                    className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Voir le fil
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.historiqueLecture.map((h) => {
                const bookId = h.livre?.id
                const card = (
                  <>
                    <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-100">
                      {h.livre?.couverture ? (
                        <img src={h.livre.couverture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-500">N/A</div>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-900">{h.livre?.titre}</p>
                    <p className="line-clamp-1 text-[11px] text-slate-500">{h.livre?.auteur}</p>
                  </>
                )
                return bookId ? (
                  <Link
                    key={h.id}
                    to={`/books/${bookId}`}
                    className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={h.id} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    {card}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-primary">Derniers avis</h2>
            {!avisEmpty && (
              <span className="text-sm text-muted">
                {data.stats.avis} avis publié{data.stats.avis !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {avisEmpty ? (
            <EmptyState
              icon={<EmptyStateIconChat />}
              title="Pas encore d’avis publics"
              description={
                isOwnProfile
                  ? 'Partagez votre ressenti sur les livres que vous lisez.'
                  : 'Les avis publiés par ce membre s’afficheront ici.'
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.derniersAvis.map((a) => (
                <ProfileReviewRow key={a.id} review={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

type ProfileReview = ProfilePayload['derniersAvis'][number]

function ProfileReviewRow({ review }: { review: ProfileReview }) {
  const bookId = review.livre?.id ?? review.livreId ?? null
  const bookLink = bookId != null ? `/books/${bookId}` : null
  const title = review.livre?.titre ?? 'Livre'

  const cover = (
    <div className="h-[4.5rem] w-[3.25rem] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 transition group-hover:ring-primary/40">
      {review.livre?.couverture ? (
        <img src={review.livre.couverture} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <BookOpen className="h-5 w-5 text-slate-400" aria-hidden />
        </div>
      )}
    </div>
  )

  return (
    <article className="group flex gap-4 py-4 first:pt-0 last:pb-0">
      {bookLink ? (
        <Link to={bookLink} className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
          {cover}
        </Link>
      ) : (
        <div className="shrink-0">{cover}</div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            {bookLink ? (
              <Link
                to={bookLink}
                className="line-clamp-2 font-semibold text-slate-900 transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                {title}
              </Link>
            ) : (
              <p className="line-clamp-2 font-semibold text-slate-900">{title}</p>
            )}
            {review.livre?.auteur && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{review.livre.auteur}</p>}
          </div>
          {review.datePublication && (
            <time className="shrink-0 text-xs text-muted" dateTime={review.datePublication}>
              {formatRelativeDate(review.datePublication)}
            </time>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <RatingStars value={review.note} size="sm" />
          <span className="text-xs font-semibold tabular-nums text-amber-800">{review.note}/5</span>
        </div>

        <blockquote className="mt-2.5 border-l-2 border-amber-200/80 pl-3 text-sm leading-relaxed text-slate-700">
          <p className="line-clamp-4">{review.contenu}</p>
        </blockquote>
      </div>
    </article>
  )
}

function ProfileStatItem({
  label,
  value,
  icon,
  to,
}: {
  label: string
  value: number
  icon: ReactNode
  to?: string
}) {
  const content = (
    <>
      <span className="inline-flex text-slate-400">{icon}</span>
      <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </>
  )

  const className =
    'flex flex-col px-4 py-4 text-center transition hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
