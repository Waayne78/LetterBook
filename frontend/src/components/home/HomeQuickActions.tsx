import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, MessagesSquare, Search, UserRound } from 'lucide-react'

const actions: Array<{
  to: string
  title: string
  desc: string
  Icon: LucideIcon
  accent: string
}> = [
  {
    to: '/search',
    title: 'Chercher un livre',
    desc: 'Titre, auteur ou ISBN',
    Icon: Search,
    accent: 'from-orange-50 to-amber-50 ring-orange-100 text-orange-900',
  },
  {
    to: '/library',
    title: 'Ma bibliothèque',
    desc: 'Statuts et progression',
    Icon: BookOpen,
    accent: 'from-indigo-50 to-slate-50 ring-indigo-100 text-indigo-900',
  },
  {
    to: '/discover',
    title: 'Trouver des lecteurs',
    desc: 'S’abonner et se lier',
    Icon: UserRound,
    accent: 'from-violet-50 to-indigo-50 ring-violet-100 text-violet-900',
  },
  {
    to: '/feed',
    title: 'Fil complet',
    desc: 'Toutes les activités',
    Icon: MessagesSquare,
    accent: 'from-slate-50 to-surface-warm ring-slate-200 text-slate-800',
  },
]

export function HomeQuickActions() {
  return (
    <section aria-labelledby="home-quick-actions">
      <h2 id="home-quick-actions" className="sr-only">
        Accès rapide
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((item) => {
          const Icon = item.Icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ${item.accent}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-primary group-hover:text-link">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
