import { Link } from 'react-router-dom'
import type { BookLivre } from '../../types/bookDetail'

type RelatedBooksProps = {
  books: BookLivre[]
}

export function RelatedBooks({ books }: RelatedBooksProps) {
  if (books.length === 0) {
    return null
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Lecteurs aussi</h2>
      <ul className="mt-4 space-y-4">
        {books.map((livre) => {
          if (livre.id == null) {
            return null
          }
          return (
            <li key={livre.id}>
              <Link
                to={`/books/${livre.id}`}
                className="flex gap-3 rounded-xl p-2 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm">
                  {livre.couverture ? (
                    <img src={livre.couverture} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{livre.titre}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{livre.auteur}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
