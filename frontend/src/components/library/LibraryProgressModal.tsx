import { useMemo } from 'react'
import {
  BookOpenCheck,
  CheckCircle2,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { isReadingComplete } from '../../lib/libraryProgress'
import type { LibraryPageEditorState } from '../../types/library'

const readingStatusOptions = [
  { value: 'en_cours', label: 'En cours', icon: BookOpenCheck },
  { value: 'termine', label: 'Terminé', icon: CheckCircle2 },
] as const

type LibraryProgressModalProps = {
  editor: LibraryPageEditorState
  saving: boolean
  error: string | null
  onChange: (editor: LibraryPageEditorState) => void
  onClose: () => void
  onSave: () => void
}

function previewProgress(editor: LibraryPageEditorState): number | null {
  if (editor.statut !== 'en_cours') {
    return null
  }
  const current = Number(editor.current)
  const total = Number(editor.total)
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0 || current < 0) {
    return null
  }
  return Math.min(100, Math.round((current / total) * 100))
}

export function LibraryProgressModal({
  editor,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: LibraryProgressModalProps) {
  const progressPreview = useMemo(() => previewProgress(editor), [editor])
  const willComplete = useMemo(() => isReadingComplete(editor), [editor])
  const statusActive = willComplete ? 'termine' : editor.statut

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-progress-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50/40 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ma bibliothèque</p>
              <h3 id="library-progress-title" className="mt-1 text-lg font-semibold text-slate-900">
                Progression de lecture
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{editor.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">Statut</p>
            <div
              className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
              role="group"
              aria-label="Statut de lecture"
            >
              {readingStatusOptions.map((option) => {
                const Icon = option.icon
                const active = statusActive === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange({ ...editor, statut: option.value })}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:justify-center sm:gap-2 sm:px-3 ${
                      active
                        ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="text-[11px] font-semibold sm:text-xs">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {editor.statut === 'en_cours' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-center text-sm font-semibold text-slate-800">Page de lecture</p>
              <p className="mt-1 text-center text-xs text-slate-500">
                Sur {editor.total} pages au total
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                <label className="sr-only" htmlFor="library-progress-current">
                  Page actuelle
                </label>
                <input
                  id="library-progress-current"
                  type="number"
                  min={0}
                  max={Number(editor.total) || undefined}
                  inputMode="numeric"
                  value={editor.current}
                  onChange={(e) => onChange({ ...editor, current: e.target.value })}
                  className="w-[4.5rem] appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-2xl font-bold tabular-nums text-slate-900 shadow-inner focus:border-primary focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-xl font-light text-slate-300" aria-hidden>
                  /
                </span>
                <span
                  className="min-w-[4.5rem] text-center text-2xl font-bold tabular-nums text-slate-400"
                  aria-label={`${editor.total} pages au total`}
                >
                  {editor.total}
                </span>
              </div>

              {progressPreview !== null && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Progression</span>
                    <span className="tabular-nums text-amber-800">{progressPreview} %</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                      style={{ width: `${progressPreview}%` }}
                    />
                  </div>
                </div>
              )}

              {willComplete && (
                <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 text-center text-sm text-emerald-800">
                  Dernière page atteinte — le livre sera marqué Terminé.
                </p>
              )}
            </div>
          )}

          {editor.statut === 'termine' && (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-800">
              Lecture terminée — la progression sera réinitialisée.
            </p>
          )}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
