import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { LibraryAddButtons } from '../library/LibraryAddButtons'
import { LibraryManageActions } from '../library/LibraryManageActions'
import { bookDetailPath } from '../../lib/bookDetailPath'
import { libraryStatusBadgeClass } from '../../lib/libraryProgress'
import type { BookHit } from '../../types/bookSearch'
import type { LibraryEntry } from '../../types/library'

type BookSearchResultCardProps = {
  hit: BookHit
  source: 'local' | 'google'
  libraryEntry: LibraryEntry | null
  busy: boolean
  onAdd: (statut: string) => void
  onManage: () => void
  onRemove: () => void
}

export function BookSearchResultCard({
  hit,
  source,
  libraryEntry,
  busy,
  onAdd,
  onManage,
  onRemove,
}: BookSearchResultCardProps) {
  const href = bookDetailPath(hit, source)
  const title = hit.titre || 'Sans titre'
  const inLibrary = libraryEntry != null

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${busy ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        {hit.couverture ? (
          <img
            src={hit.couverture}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
            <BookOpen className="h-8 w-8 text-slate-300" aria-hidden />
            <p className="px-3 text-xs">Pas de couverture</p>
          </div>
        )}

        {inLibrary ? (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${libraryStatusBadgeClass(libraryEntry.statut)}`}
          >
            {libraryEntry.statutLabel}
          </span>
        ) : (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              source === 'local' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
            }`}
          >
            {source === 'local' ? 'Sur LetterBook' : 'À découvrir'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {href ? (
          <Link
            to={href}
            className="line-clamp-2 text-lg font-semibold leading-snug text-primary hover:text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            {title}
          </Link>
        ) : (
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-primary">{title}</h3>
        )}
        <p className="mt-1 line-clamp-1 text-sm text-slate-600">{hit.auteur || 'Auteur inconnu'}</p>

        {inLibrary && libraryEntry.progression !== null && libraryEntry.progression > 0 && (
          <p className="mt-3 text-xs font-medium text-slate-500">Progression: {libraryEntry.progression}%</p>
        )}

        <div className="mt-auto space-y-2 pt-3">
          {inLibrary ? (
            <LibraryManageActions busy={busy} onManage={onManage} onRemove={onRemove} />
          ) : (
            <LibraryAddButtons busy={busy} onAdd={onAdd} />
          )}
          {href && (
            <Link
              to={href}
              className="block text-center text-xs font-semibold text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Voir la fiche →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
