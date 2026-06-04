import type { ReactNode } from 'react'

type BookSearchSectionProps = {
  id: string
  title: string
  count: number
  variant: 'community' | 'discover'
  description?: string
  children: ReactNode
}

export function BookSearchSection({ id, title, count, variant, description, children }: BookSearchSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-5">
      <div className="flex items-start gap-3">
        <span
          className={`mt-2 h-2.5 w-2.5 rounded-full ${variant === 'community' ? 'bg-primary' : 'bg-accent'}`}
          aria-hidden
        />
        <div>
          <h2 id={id} className="text-lg font-semibold text-primary">
            {title}
            <span className="ml-2 text-sm font-normal text-slate-500">({count})</span>
          </h2>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
    </section>
  )
}
