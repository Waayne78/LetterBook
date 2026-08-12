import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpenCheck,
  Bookmark,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { LibraryProgressModal } from '../library/LibraryProgressModal'
import {
  buildLibraryProgressPatch,
  createEnCoursPageEditor,
  pageEditorFromEntry,
} from '../../lib/libraryProgress'
import { currentPageFromProgress } from '../../lib/bookMeta'
import type { BookLivre, MyLibraryEntry } from '../../types/bookDetail'
import type { LibraryPageEditorState } from '../../types/library'

type BookDetailLibraryActionsProps = {
  livre: BookLivre
  isPreview: boolean
  isLoggedIn: boolean
  myLibrary: MyLibraryEntry | null
  addingLibrary: boolean
  updatingLibrary: boolean
  onAddToLibrary: (statut: string, progression?: number | null) => void | Promise<void>
  onUpdateLibrary: (patch: { statut?: string; progression?: number | null }) => void | Promise<void>
  onRemoveFromLibrary: () => void
}

export function BookDetailLibraryActions({
  livre,
  isPreview,
  isLoggedIn,
  myLibrary,
  addingLibrary,
  updatingLibrary,
  onAddToLibrary,
  onUpdateLibrary,
  onRemoveFromLibrary,
}: BookDetailLibraryActionsProps) {
  const [pageEditor, setPageEditor] = useState<LibraryPageEditorState | null>(null)
  const [pageEditorError, setPageEditorError] = useState<string | null>(null)
  const busy = addingLibrary || updatingLibrary
  const inLibrary = myLibrary != null && !isPreview
  const totalPages = livre.nombrePages ?? null
  const statut = inLibrary ? myLibrary.statut : null
  const progress = inLibrary ? (myLibrary.progression ?? 0) : 0
  const currentPage =
    statut === 'en_cours' ? currentPageFromProgress(myLibrary?.progression, totalPages) : null

  async function savePageProgress() {
    if (!pageEditor) {
      return
    }
    const result = buildLibraryProgressPatch(pageEditor)
    if (result.ok === false) {
      setPageEditorError(result.error)
      return
    }
    if (inLibrary) {
      await onUpdateLibrary(result.patch)
    } else {
      await onAddToLibrary(result.patch.statut, result.patch.progression ?? null)
    }
    setPageEditor(null)
    setPageEditorError(null)
  }

  function openEditor() {
    setPageEditorError(null)
    if (inLibrary && myLibrary) {
      setPageEditor(pageEditorFromEntry(myLibrary, totalPages))
      return
    }
    setPageEditor(createEnCoursPageEditor(livre.titre, totalPages))
  }

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-slate-600">
        <Link
          to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
          className="font-semibold text-primary hover:underline"
        >
          Connectez-vous
        </Link>{' '}
        pour suivre ce livre.
      </p>
    )
  }

  if (!inLibrary) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={openEditor}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <BookOpenCheck className="h-4 w-4" aria-hidden />
            )}
            Commencer la lecture
          </button>
          <p className="text-xs text-slate-500">
            ou utilisez le favori pour l’ajouter à lire
          </p>
        </div>

        {pageEditor && (
          <LibraryProgressModal
            editor={pageEditor}
            saving={busy}
            error={pageEditorError}
            onChange={setPageEditor}
            onClose={() => {
              setPageEditor(null)
              setPageEditorError(null)
            }}
            onSave={() => void savePageProgress()}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="max-w-md rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
        {statut === 'en_cours' && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <BookOpenCheck className="h-3.5 w-3.5" aria-hidden />
                  En cours
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {currentPage != null && totalPages != null
                    ? `Page ${currentPage} sur ${totalPages}`
                    : progress > 0
                      ? `${progress} % lu`
                      : 'Progression à définir'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={openEditor}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-slate-200/90 transition hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Modifier
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRemoveFromLibrary}
                  title="Retirer de ma bibliothèque"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-600 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">Retirer</span>
                </button>
              </div>
            </div>
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/90">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                  style={{ width: `${Math.min(100, Math.max(progress, progress > 0 ? 2 : 0))}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-[11px] font-medium tabular-nums text-amber-800">
                {progress} %
              </p>
            </div>
          </div>
        )}

        {statut === 'termine' && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Terminé
              </p>
              <p className="mt-0.5 text-sm text-slate-600">Lecture achevée</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={busy}
                onClick={openEditor}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-slate-200/90 transition hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
                Modifier
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onRemoveFromLibrary}
                title="Retirer de ma bibliothèque"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-600 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">Retirer</span>
              </button>
            </div>
          </div>
        )}

        {statut === 'a_lire' && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-800">
                <Bookmark className="h-3.5 w-3.5" aria-hidden />
                À lire
              </p>
              <p className="mt-0.5 text-sm text-slate-600">Dans votre liste d’attente</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={busy}
                onClick={openEditor}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-slate-200/90 transition hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Modifier
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onRemoveFromLibrary}
                title="Retirer de ma bibliothèque"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-600 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">Retirer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {pageEditor && (
        <LibraryProgressModal
          editor={pageEditor}
          saving={busy}
          error={pageEditorError}
          onChange={setPageEditor}
          onClose={() => {
            setPageEditor(null)
            setPageEditorError(null)
          }}
          onSave={() => void savePageProgress()}
        />
      )}
    </>
  )
}
