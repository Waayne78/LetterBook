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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Lecteurs ont aussi lu</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((livre) => {
          if (livre.id == null) {
            return null
          }
          return (
            <li key={livre.id}>
              <Link
                to={`/books/${livre.id}`}
                className="flex h-full gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm ring-1 ring-slate-200">
                  {livre.couverture ? (
                    <img src={livre.couverture} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{livre.titre}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{livre.auteur}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
