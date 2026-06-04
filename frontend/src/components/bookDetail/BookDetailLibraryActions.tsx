import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked } from 'lucide-react'
import { LibraryAddButtons } from '../library/LibraryAddButtons'
import { LibraryManageActions } from '../library/LibraryManageActions'
import { LibraryProgressModal } from '../library/LibraryProgressModal'
import { buildLibraryProgressPatch, libraryStatusBadgeClass, pageEditorFromEntry } from '../../lib/libraryProgress'
import type { MyLibraryEntry } from '../../types/bookDetail'
import type { LibraryPageEditorState } from '../../types/library'

type BookDetailLibraryActionsProps = {
  isPreview: boolean
  isLoggedIn: boolean
  myLibrary: MyLibraryEntry | null
  addingLibrary: boolean
  updatingLibrary: boolean
  onAddToLibrary: (statut: string) => void
  onUpdateLibrary: (patch: { statut?: string; progression?: number | null }) => void
  onRemoveFromLibrary: () => void
}

export function BookDetailLibraryActions({
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

  if (!isLoggedIn) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3 text-sm text-slate-600">
        <BookMarked className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" aria-hidden />
        <p>
          <Link
            to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="font-semibold text-primary hover:underline"
          >
            Connectez-vous
          </Link>{' '}
          pour suivre ce livre et publier un avis.
        </p>
      </div>
    )
  }

  async function savePageProgress() {
    if (!pageEditor) {
      return
    }
    const result = buildLibraryProgressPatch(pageEditor)
    if (result.ok === false) {
      setPageEditorError(result.error)
      return
    }
    await onUpdateLibrary(result.patch)
    setPageEditor(null)
    setPageEditorError(null)
  }

  if (myLibrary && !isPreview) {
    return (
      <div className="space-y-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${libraryStatusBadgeClass(myLibrary.statut)}`}
        >
          {myLibrary.statutLabel}
        </span>

        {myLibrary.progression !== null && myLibrary.progression > 0 && (
          <p className="text-xs font-medium text-slate-600">Progression : {myLibrary.progression} %</p>
        )}

        <LibraryManageActions
          busy={busy}
          onManage={() => {
            setPageEditorError(null)
            setPageEditor(pageEditorFromEntry(myLibrary))
          }}
          onRemove={onRemoveFromLibrary}
        />

        <Link to="/library" className="inline-block text-xs font-medium text-link hover:underline">
          Voir dans ma bibliothèque →
        </Link>

        {pageEditor && (
          <LibraryProgressModal
            editor={pageEditor}
            saving={updatingLibrary}
            error={pageEditorError}
            onChange={setPageEditor}
            onClose={() => {
              setPageEditor(null)
              setPageEditorError(null)
            }}
            onSave={() => void savePageProgress()}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {isPreview ? 'Ajouter à ma bibliothèque' : 'Ma bibliothèque'}
      </p>
      <LibraryAddButtons busy={busy} onAdd={onAddToLibrary} />
    </div>
  )
}
