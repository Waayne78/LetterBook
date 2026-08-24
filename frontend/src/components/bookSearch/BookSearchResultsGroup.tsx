import type { ReactNode } from 'react'

type BookSearchResultsGroupProps = {
  id: string
  title: string
  count: number
  children: ReactNode
}

export function BookSearchResultsGroup({ id, title, count, children }: BookSearchResultsGroupProps) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id={id} className="text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {count} livre{count !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold tabular-nums text-slate-600 shadow-sm ring-1 ring-slate-200">
          {count}
        </span>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">{children}</ul>
    </section>
  )
}
