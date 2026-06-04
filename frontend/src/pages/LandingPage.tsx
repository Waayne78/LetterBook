import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Check,
  Circle,
  MessagesSquare,
  Star,
  UserRound,
} from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { LoggedInHome } from '../components/home/LoggedInHome'
type FeedPreview = {
  avisRecents: Array<{
    id: number
    note: number
    livre?: { titre: string; auteur: string }
    user?: { pseudo: string }
  }>
}

function StarDots({ note }: { note: number }) {
  const n = Math.min(5, Math.max(0, Math.round(note)))
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? 'fill-amber-400 text-amber-400' : 'fill-white/15 text-white/30'}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}

function HomeLoadingSkeleton() {
  return (
    <div className="space-y-20" aria-busy="true">
      <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8 animate-pulse">
          <div className="h-8 w-32 rounded-full bg-slate-200/90" />
          <div className="h-16 rounded-2xl bg-slate-200/80 md:h-20" />
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="flex flex-wrap gap-3">
            <div className="h-12 w-44 rounded-2xl bg-slate-200" />
            <div className="h-12 w-36 rounded-2xl bg-slate-100" />
          </div>
        </div>
        <div className="min-h-[320px] animate-pulse rounded-[2rem] bg-slate-200/70 lg:min-h-[360px]" />
      </section>
    </div>
  )
}

function FeedPreviewCard({
  previewLoading,
  hasPreview,
  previewLines,
  loggedIn,
}: {
  previewLoading: boolean
  hasPreview: boolean
  previewLines: FeedPreview['avisRecents']
  loggedIn: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-[#0c1428] to-indigo-950 p-8 text-primary-foreground shadow-[0_25px_60px_-15px_rgba(15,23,42,0.55)] ring-1 ring-white/5">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%),radial-gradient(circle_at_80%_80%,#fb923c,transparent_45%)]" />

      <div className="relative space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200/90 ring-1 ring-white/15">
            Fil en direct
          </span>
          <span className="text-xs text-slate-400">Mis à jour régulièrement</span>
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Espace lecteur</p>
          <p className="mt-2 text-2xl font-semibold leading-snug tracking-tight text-white md:text-[1.65rem]">
            {loggedIn
              ? 'Reprenez là où vous vous étiez arrêté·e.'
              : 'Découvrez ce que la communauté lit et note.'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Aperçu du fil</p>
          {previewLoading && (
            <div className="mt-4 space-y-3" aria-live="polite">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-white/10" />
              ))}
            </div>
          )}
          {!previewLoading && hasPreview && (
            <ul className="mt-4 space-y-3">
              {previewLines.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-sm leading-relaxed text-slate-100"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">{a.user?.pseudo ?? 'Lecteur'}</span>
                    <StarDots note={a.note} />
                  </div>
                  <p className="mt-1 text-slate-300">
                    <span className="italic text-slate-200">{a.livre?.titre ?? 'Un livre'}</span>
                    <span className="text-slate-500"> · </span>
                    <span className="tabular-nums text-amber-200/90">{a.note}/5</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {!previewLoading && !hasPreview && (
            <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-4 text-left">
              <p className="text-sm leading-relaxed text-slate-300">
                Pas encore d’avis publics. Lancez la conversation ou explorez le fil.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/feed"
                  className="rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Ouvrir le fil
                </Link>
                {!loggedIn && (
                  <Link
                    to="/register"
                    className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-lg shadow-orange-950/30 transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Créer un compte
                  </Link>
                )}
                {loggedIn && (
                  <Link
                    to="/library"
                    className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-lg shadow-orange-950/30 transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Ma bibliothèque
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const trustItems = [
  { label: 'Gratuit', sub: 'Sans engagement' },
  { label: 'Centré livres', sub: 'Pas de fil généraliste' },
  { label: 'Vie privée', sub: 'Vous contrôlez le visible' },
] as const

function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-2 md:gap-10">
      {trustItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-surface/90 px-5 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-sm"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Check className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">{item.label}</p>
            <p className="text-xs text-muted">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const guestFeatures: Array<{
  title: string
  body: string
  Icon: LucideIcon
  tint: string
}> = [
  {
    title: 'Bibliothèque vivante',
    body: 'Ajoutez des livres, suivez vos statuts et retrouvez tout au même endroit.',
    Icon: BookOpen,
    tint: 'bg-orange-50 text-orange-700 ring-orange-100',
  },
  {
    title: 'Avis sincères',
    body: 'Notes sur 5 et commentaires pour partager ce qui vous a marqué.',
    Icon: Star,
    tint: 'bg-amber-50 text-amber-800 ring-amber-100',
  },
  {
    title: 'Fil communautaire',
    body: 'Découvrez les lectures du moment et réagissez aux avis des autres.',
    Icon: MessagesSquare,
    tint: 'bg-indigo-50 text-indigo-800 ring-indigo-100',
  },
  {
    title: 'Profil lecteur',
    body: 'Bio, photo et liste publique pour présenter votre univers.',
    Icon: UserRound,
    tint: 'bg-slate-100 text-slate-800 ring-slate-200',
  },
]

const steps = [
  { step: '01', title: 'Créez votre compte', body: 'Pseudo, email — accès au fil et à votre bibliothèque.' },
  { step: '02', title: 'Ajoutez vos livres', body: 'Recherche ou ISBN : gardez traces de ce que vous lisez.' },
  { step: '03', title: 'Partagez vos avis', body: 'Notez, commentez et rejoignez la conversation.' },
] as const

function GuestMarketingSections() {
  return (
    <>
      <TrustStrip />

      <section className="rounded-[2rem] border border-slate-200/70 bg-surface/95 p-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)] backdrop-blur-sm md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Une expérience pensée pour les lecteurs
          </h2>
          <p className="mt-3 text-lg text-muted">
            LetterBook relie votre bibliothèque personnelle au fil communautaire — sans surcharge
            inutile.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {guestFeatures.map((f) => {
            const FeatureIcon = f.Icon
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-surface-warm/80 p-6 shadow-sm transition hover:border-accent/25 hover:shadow-md"
              >
                <div
                  className={`inline-flex rounded-2xl p-3 ring-1 ${f.tint} transition group-hover:scale-[1.02]`}
                >
                  <FeatureIcon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.step}
            className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm"
          >
            <span className="font-display text-5xl font-bold tabular-nums text-accent/15">
              {s.step}
            </span>
            <h3 className="mt-4 text-xl font-semibold text-primary">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-slate-900 to-indigo-950 px-8 py-14 text-center text-primary-foreground shadow-2xl shadow-slate-900/40 md:px-14">
        <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,#fb923c55,transparent_45%),radial-gradient(circle_at_90%_80%,#6366f144,transparent_40%)]" />
        <div className="relative mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Prêt·e à ranger vos lectures et à rejoindre la communauté ?
          </h2>
          <p className="text-lg text-slate-300">
            Créez un compte en quelques secondes, ou parcourez le fil en tant qu’invité·e.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="inline-flex rounded-2xl bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg shadow-orange-950/40 transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Créer mon compte
            </Link>
            <Link
              to="/login"
              className="inline-flex rounded-2xl border border-white/25 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              J’ai déjà un compte
            </Link>
          </div>
          <p className="text-sm text-slate-400">
            <Link to="/feed" className="font-medium text-amber-200/90 underline-offset-4 hover:underline">
              Voir le fil sans s’inscrire
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}

const btnPrimary =
  'inline-flex items-center justify-center rounded-2xl bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-lg shadow-orange-900/15 transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
const btnSecondary =
  'inline-flex items-center justify-center rounded-2xl border border-slate-200/90 bg-surface px-7 py-3.5 text-sm font-semibold text-primary shadow-sm transition hover:border-slate-300 hover:bg-surface-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

function GuestHero({
  previewLoading,
  hasPreview,
  previewLines,
}: {
  previewLoading: boolean
  hasPreview: boolean
  previewLines: FeedPreview['avisRecents']
}) {
  return (
    <section className="relative grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-14">
      <div className="relative z-[1] space-y-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-surface/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted shadow-sm backdrop-blur">
          <Circle
            className="h-2 w-2 shrink-0 fill-accent text-accent drop-shadow-[0_0_8px_rgba(234,88,12,0.75)]"
            aria-hidden
            strokeWidth={0}
          />
          Réseau social pour lectrices et lecteurs
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-primary md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
          Votre bibliothèque personnelle,{' '}
          <span className="bg-gradient-to-r from-accent via-orange-500 to-orange-700 bg-clip-text text-transparent">
            partagée avec le monde.
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          Suivez vos lectures, notez ce qui compte pour vous et découvrez ce que les autres lisent — dans une
          interface simple, pensée pour les livres avant tout.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/register" className={btnPrimary}>
            Rejoindre LetterBook
          </Link>
          <Link to="/login" className={btnSecondary}>
            Connexion
          </Link>
        </div>
        <p className="text-sm text-muted">
          Pas encore prêt·e ?{' '}
          <Link to="/feed" className="font-semibold text-link underline-offset-4 hover:text-link-hover hover:underline">
            Parcourir le fil
          </Link>{' '}
          sans compte.
        </p>
      </div>
      <FeedPreviewCard
        previewLoading={previewLoading}
        hasPreview={hasPreview}
        previewLines={previewLines}
        loggedIn={false}
      />
    </section>
  )
}

export function LandingPage() {
  const { user, loading, token } = useAuth()
  const [preview, setPreview] = useState<FeedPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setPreviewLoading(true)
      try {
        const { data } = await api.get<FeedPreview>('/feed')
        if (!cancelled) {
          setPreview(data)
        }
      } catch {
        if (!cancelled) {
          setPreview(null)
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const previewLines = preview?.avisRecents?.slice(0, 3) ?? []
  const hasPreview = previewLines.length > 0

  if (loading && token) {
    return <HomeLoadingSkeleton />
  }

  if (user) {
    return (
      <LoggedInHome user={user} />
    )
  }

  return (
    <div className="space-y-20 pb-8">
      <GuestHero
        previewLoading={previewLoading}
        hasPreview={hasPreview}
        previewLines={previewLines}
      />
      <GuestMarketingSections />
    </div>
  )
}
