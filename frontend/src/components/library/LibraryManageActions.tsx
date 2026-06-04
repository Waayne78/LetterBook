import { Loader2, Trash2 } from 'lucide-react'

type LibraryManageActionsProps = {
  busy?: boolean
  onManage: () => void
  onRemove: () => void
  compact?: boolean
}

export function LibraryManageActions({ busy, onManage, onRemove, compact }: LibraryManageActionsProps) {
  const btnClass = compact
    ? 'inline-flex items-center justify-center rounded-lg border border-slate-200 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
    : 'inline-flex items-center justify-center rounded-xl border border-slate-200 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onManage}
        className={`${btnClass} text-primary hover:bg-slate-50 disabled:opacity-60`}
      >
        Gérer
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onRemove}
        className={`${btnClass} gap-1.5 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60`}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        )}
        Retirer
      </button>
    </div>
  )
}
