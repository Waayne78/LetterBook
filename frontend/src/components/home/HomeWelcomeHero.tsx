import { Link } from 'react-router-dom'
import { BookOpen, Sparkles, Users } from 'lucide-react'
import type { UserMe } from '../../auth/auth-context'
import type { MeSocialResponse } from '../../types/social'
import { UserAvatar } from '../ui/UserAvatar'

type HomeWelcomeHeroProps = {
  user: UserMe
  social: MeSocialResponse | null
}

export function HomeWelcomeHero({ user, social }: HomeWelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-primary via-slate-900 to-indigo-950 p-8 text-primary-foreground shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] md:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_20%_30%,white,transparent_45%)]" aria-hidden />

      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-5">
          <UserAvatar
            pseudo={user.pseudo}
            photo={user.photo}
            className="h-16 w-16 shrink-0 ring-2 ring-white/20 backdrop-blur-sm"
            textClassName="text-xl bg-white/15"
          />
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
              Bonjour
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
              {user.pseudo}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
              Retrouvez l’activité de vos abonnements, vos amis et toute la communauté LetterBook.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link
            to="/library"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/20"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            Ma bibliothèque
          </Link>
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg shadow-orange-950/30 transition hover:opacity-95"
          >
            <Users className="h-4 w-4" aria-hidden />
            Découvrir des lecteurs
          </Link>
        </div>
      </div>

      {social && (
        <div className="relative mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 sm:max-w-lg">
          <Link to="/network" className="rounded-xl bg-white/5 px-3 py-3 text-center ring-1 ring-white/10 transition hover:bg-white/10">
            <p className="text-2xl font-bold tabular-nums">{social.counts.following}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">Abonnements</p>
          </Link>
          <Link to="/network" className="rounded-xl bg-white/5 px-3 py-3 text-center ring-1 ring-white/10 transition hover:bg-white/10">
            <p className="text-2xl font-bold tabular-nums">{social.counts.friends}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">Amis</p>
          </Link>
          <Link to="/network" className="rounded-xl bg-white/5 px-3 py-3 text-center ring-1 ring-white/10 transition hover:bg-white/10">
            <p className="text-2xl font-bold tabular-nums">{social.counts.followers}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">Abonnés</p>
          </Link>
        </div>
      )}
    </section>
  )
}
