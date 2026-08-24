import { useState } from 'react'
import { stripHtml } from '../../lib/stripHtml'

type BookDetailSummaryProps = {
  resume: string | null
}

const CLAMP_LENGTH = 420

export function BookDetailSummary({ resume }: BookDetailSummaryProps) {
  const [expanded, setExpanded] = useState(false)

  if (!resume || resume.trim() === '') {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Résumé</h2>
        <p className="mt-2 text-sm text-muted">Aucun résumé disponible pour ce livre.</p>
      </section>
    )
  }

  const plain = stripHtml(resume)
  const needsClamp = plain.length > CLAMP_LENGTH
  const display = expanded || !needsClamp ? plain : `${plain.slice(0, CLAMP_LENGTH).trim()}…`

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Résumé</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{display}</p>
      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
    </section>
  )
}
