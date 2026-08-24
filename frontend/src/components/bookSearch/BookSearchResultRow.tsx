import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Loader2, Settings2, Trash2 } from 'lucide-react'
import { LibraryQuickAdd } from '../library/LibraryQuickAdd'
import { bookDetailPath } from '../../lib/bookDetailPath'
import { libraryStatusBadgeClass } from '../../lib/libraryProgress'
import type { BookHit } from '../../types/bookSearch'
import type { LibraryEntry } from '../../types/library'

type BookSearchResultRowProps = {
  hit: BookHit
  source: 'local' | 'google'
  libraryEntry: LibraryEntry | null
  busy: boolean
  onAdd: (statut: string) => void
  onManage: () => void
  onRemove: () => void
}

export function BookSearchResultRow({
  hit,
  source,
  libraryEntry,
  busy,
  onAdd,
  onManage,
  onRemove,
}: BookSearchResultRowProps) {
  const href = bookDetailPath(hit, source)
  const title = hit.titre || 'Sans titre'
  const inLibrary = libraryEntry != null
  const progress = libraryEntry?.progression ?? 0
  const showProgress = inLibrary && libraryEntry.statut === 'en_cours' && progress > 0

  const sourceBadgeClass =
    source === 'local' ? 'bg-primary/10 text-primary ring-primary/15' : 'bg-slate-100 text-slate-600 ring-slate-200'

  return (
    <li className={`group relative flex min-h-44 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:z-10 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-within:z-20 ${busy ? 'opacity-60' : ''}`}>
      {href ? (
        <Link to={href} className="group/cover shrink-0 self-start rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="h-32 w-[5.75rem] overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200 transition group-hover/cover:ring-primary/30 sm:h-36 sm:w-[6.5rem]">
            {hit.couverture ? (
              <img
                src={hit.couverture}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover/cover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <BookOpen className="h-6 w-6" aria-hidden />
              </div>
            )}
          </div>
        </Link>
      ) : (
        <div className="h-32 w-[5.75rem] shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 sm:h-36 sm:w-[6.5rem]">
          {hit.couverture ? (
            <img src={hit.couverture} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <BookOpen className="h-6 w-6" aria-hidden />
            </div>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1 pb-11">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {href ? (
            <Link
              to={href}
              className="line-clamp-2 pr-1 font-bold leading-snug text-slate-900 transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              {title}
            </Link>
          ) : (
            <p className="line-clamp-2 font-semibold text-slate-900">{title}</p>
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{hit.auteur || 'Auteur inconnu'}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {inLibrary ? (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${libraryStatusBadgeClass(libraryEntry.statut)}`}
            >
              {libraryEntry.statutLabel}
            </span>
          ) : (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${sourceBadgeClass}`}
            >
              {source === 'local' ? 'LetterBook' : 'Catalogue étendu'}
            </span>
          )}
          {hit.genre && (
            <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
              {hit.genre}
            </span>
          )}
        </div>

        {hit.resume && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{hit.resume}</p>
        )}

        {showProgress && (
          <div className="mt-2.5 max-w-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Progression</span>
              <span className="font-semibold tabular-nums text-amber-800">{progress} %</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>
        )}

      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {href && (
          <Link
            to={href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Voir la fiche"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">Voir la fiche de {title}</span>
          </Link>
        )}
        {inLibrary ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={onManage}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Settings2 className="h-4 w-4" aria-hidden />
              )}
              Gérer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Retirer de la bibliothèque"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Retirer</span>
            </button>
          </>
        ) : (
          <LibraryQuickAdd busy={busy} onAdd={onAdd} />
        )}
      </div>
    </li>
  )
}
