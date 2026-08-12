import type { ReactNode } from 'react'
import type { BookLivre } from '../../types/bookDetail'
import {
  formatIsbn,
} from '../../lib/bookMeta'

type PillVariant = 'default' | 'genre' | 'muted'

const pillStyles: Record<PillVariant, string> = {
  genre:
    'bg-primary/5 font-medium text-primary ring-primary/15',
  default:
    'bg-white/80 font-medium text-slate-700 ring-slate-200/80',
  muted:
    'bg-slate-50/90 font-normal text-slate-500 ring-slate-200/60',
}

function MetaPill({
  children,
  variant = 'default',
  mono = false,
  title,
}: {
  children: ReactNode
  variant?: PillVariant
  mono?: boolean
  title?: string
}) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs ring-1 backdrop-blur-sm ${pillStyles[variant]} ${mono ? 'font-mono text-[11px]' : ''}`}
    >
      <span className="truncate">{children}</span>
    </span>
  )
}

type BookDetailMetaStripProps = {
  livre: BookLivre
}

export function BookDetailMetaStrip({ livre }: BookDetailMetaStripProps) {
  const isbn = formatIsbn(livre.isbn)
  const pills: ReactNode[] = []

  if (livre.genre) {
    pills.push(
      <MetaPill key="genre" variant="genre" title={livre.genre}>
        {livre.genre}
      </MetaPill>,
    )
  }

  if (livre.editeur) {
    pills.push(
      <MetaPill key="publisher" variant="default" title={livre.editeur}>
        {livre.editeur}
      </MetaPill>,
    )
  }

  if (isbn) {
    pills.push(
      <MetaPill key="isbn" variant="muted" mono title={`ISBN ${isbn}`}>
        ISBN {isbn}
      </MetaPill>,
    )
  }

  if (pills.length === 0) {
    return null
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 md:justify-start" aria-label="Informations sur le livre">
      {pills}
    </div>
  )
}
