import { Loader2, X } from 'lucide-react'
import { libraryStatutOptions } from '../../lib/libraryProgress'
import type { LibraryPageEditorState } from '../../types/library'

type LibraryProgressModalProps = {
  editor: LibraryPageEditorState
  saving: boolean
  error: string | null
  onChange: (editor: LibraryPageEditorState) => void
  onClose: () => void
  onSave: () => void
}

export function LibraryProgressModal({
  editor,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: LibraryProgressModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Fermer" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Progression en pages</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{editor.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <select
            value={editor.statut}
            onChange={(e) => onChange({ ...editor, statut: e.target.value })}
            className="col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-primary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {libraryStatutOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {editor.statut === 'en_cours' && (
            <>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={editor.current}
                onChange={(e) => onChange({ ...editor, current: e.target.value })}
                placeholder="Page actuelle"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <span className="text-sm font-semibold text-slate-500">/</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={editor.total}
                onChange={(e) => onChange({ ...editor, total: e.target.value })}
                placeholder="Pages totales"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-red-700">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
