import type { NoteDistribution as NoteDistributionType } from '../../types/bookDetail'
import { RatingStars } from './RatingStars'

type NoteDistributionProps = {
  distribution: NoteDistributionType
  average: number | null
  totalReviews: number
}

export function NoteDistribution({ distribution, average, totalReviews }: NoteDistributionProps) {
  const max = Math.max(1, ...Object.values(distribution))

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex shrink-0 flex-col items-center gap-1 sm:items-start">
        <span className="text-4xl font-bold tabular-nums text-primary">
          {average !== null ? average.toFixed(1) : '—'}
        </span>
        <RatingStars value={average ?? 0} size="md" label="Note moyenne" />
        <span className="text-sm text-muted">
          {totalReviews} avis
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((n) => {
          const count = distribution[String(n) as keyof NoteDistributionType] ?? 0
          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-3 font-medium text-slate-600">{n}</span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums text-muted">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
