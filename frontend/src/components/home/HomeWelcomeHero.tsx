import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, UserPlus, Users } from 'lucide-react'
import type { UserMe } from '../../auth/auth-context'
import type { MeSocialResponse } from '../../types/social'
import { UserAvatar } from '../ui/UserAvatar'

type HomeWelcomeHeroProps = {
  user: UserMe
  social: MeSocialResponse | null
}

export function HomeWelcomeHero({ user, social }: HomeWelcomeHeroProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <UserAvatar
              pseudo={user.pseudo}
              photo={user.photo}
              className="h-16 w-16 shrink-0 ring-2 ring-slate-100 md:h-20 md:w-20"
              textClassName="text-xl md:text-2xl"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">Bonjour,</p>
              <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {user.pseudo}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                Retrouvez l’activité de vos abonnements, vos amis et toute la communauté LetterBook.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:pt-1">
            <Link
              to="/library"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              Ma bibliothèque
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Users className="h-4 w-4" aria-hidden />
              Découvrir des lecteurs
            </Link>
          </div>
        </div>
      </div>

      {social && (
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
          <HeroStatItem
            label="Abonnements"
            value={social.counts.following}
            icon={<UserPlus className="h-4 w-4" aria-hidden />}
            to="/network?tab=following"
          />
          <HeroStatItem
            label="Amis"
            value={social.counts.friends}
            icon={<Users className="h-4 w-4" aria-hidden />}
            to="/network?tab=friends"
          />
          <HeroStatItem
            label="Abonnés"
            value={social.counts.followers}
            icon={<Users className="h-4 w-4" aria-hidden />}
            to="/network?tab=followers"
          />
        </div>
      )}
    </section>
  )
}

function HeroStatItem({
  label,
  value,
  icon,
  to,
}: {
  label: string
  value: number
  icon: ReactNode
  to: string
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

  return (
    <Link to={to} className={className}>
      {content}
    </Link>
  )
}
