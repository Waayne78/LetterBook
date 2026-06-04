import { Loader2 } from 'lucide-react'

type LibraryAddButtonsProps = {
  busy: boolean
  onAdd: (statut: string) => void
  compact?: boolean
}

export function LibraryAddButtons({ busy, onAdd, compact }: LibraryAddButtonsProps) {
  const primaryBtn = compact
    ? 'rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-primary transition hover:bg-white disabled:opacity-50'
    : 'rounded-xl border border-slate-200 bg-slate-50 py-2 text-sm font-semibold text-primary transition hover:bg-white disabled:opacity-50'
  const accentBtn = compact
    ? 'rounded-lg bg-accent py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-95 disabled:opacity-50'
    : 'rounded-xl bg-accent py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-95 disabled:opacity-50'
  const fullBtn = compact
    ? 'w-full rounded-lg border border-slate-200 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50'
    : 'w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50'

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => onAdd('a_lire')} className={primaryBtn}>
          {busy ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : 'À lire'}
        </button>
        <button type="button" disabled={busy} onClick={() => onAdd('en_cours')} className={accentBtn}>
          {busy ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : 'En cours'}
        </button>
      </div>
      <button type="button" disabled={busy} onClick={() => onAdd('termine')} className={fullBtn}>
        Terminé
      </button>
    </div>
  )
}
