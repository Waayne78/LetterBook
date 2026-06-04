import { type ReactNode, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookOpen, MessageSquareQuote, Settings, UserPlus, Users } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { FollowButton } from '../components/social/FollowButton'
import { EmptyState } from '../components/ui/EmptyState'
import { UserAvatar } from '../components/ui/UserAvatar'
import { EmptyStateIconBook } from '../components/ui/emptyStateIcons'
import type { ProfileSocial } from '../types/social'

type ProfilePayload = {
  user: { id: number; pseudo: string; bio: string | null; photo: string | null; dateCreation: string }
  stats: { livresBibliotheque: number; avis: number }
  social?: ProfileSocial
  historiqueLecture: Array<{
    id: number
    livre: { id: number; titre: string; auteur: string; couverture: string | null } | null
  }>
  derniersAvis: Array<{ id: number; note: number; contenu: string; livre?: { titre: string } }>
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-primary via-slate-900 to-indigo-950 p-6 text-primary-foreground shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl" aria-hidden />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <UserAvatar
              pseudo={data.user.pseudo}
              photo={data.user.photo}
              className="h-20 w-20 ring-2 ring-white/20 md:h-24 md:w-24"
              textClassName="text-2xl"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">@{data.user.pseudo}</h1>
              <p className="mt-1 text-sm text-slate-300">Membre depuis {memberSince}</p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
                {data.user.bio || 'Ce lecteur n’a pas encore ajouté de bio.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Settings className="h-4 w-4" aria-hidden />
                Paramètres du compte
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Livres suivis" value={data.stats.livresBibliotheque} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="Avis publiés" value={data.stats.avis} icon={<MessageSquareQuote className="h-4 w-4" />} />
        {data.social && (
          <>
            <StatLink to="/network?tab=followers" label="Abonnés" value={data.social.followersCount} icon={<Users className="h-4 w-4" />} />
            <StatLink to="/network?tab=following" label="Abonnements" value={data.social.followingCount} icon={<UserPlus className="h-4 w-4" />} />
            <StatLink to="/network?tab=friends" label="Amis" value={data.social.friendsCount} icon={<Users className="h-4 w-4" />} />
          </>
        )}
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
          <h2 className="text-xl font-semibold text-primary">Derniers avis</h2>
          <div className="mt-5 space-y-3">
            {avisEmpty ? (
              <EmptyState
                title="Pas encore d’avis publics"
                description="Les avis publiés par ce membre s’afficheront ici."
              />
            ) : (
              data.derniersAvis.map((a) => (
                <article key={a.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 font-semibold text-slate-900">{a.livre?.titre || 'Livre'}</p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      {a.note}/5
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-700">{a.contenu}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-primary">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums text-primary">{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
    </div>
  )
}

function StatLink({
  to,
  label,
  value,
  icon,
}: {
  to: string
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-primary">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums text-primary">{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
    </Link>
  )
}
