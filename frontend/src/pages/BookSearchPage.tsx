import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Loader2, SearchX, Sparkles } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { BookSearchField } from '../components/bookSearch/BookSearchField'
import { BookSearchResultCard } from '../components/bookSearch/BookSearchResultCard'
import { BookSearchSection } from '../components/bookSearch/BookSearchSection'
import { BookSearchSkeleton } from '../components/bookSearch/BookSearchSkeleton'
import { LibraryProgressModal } from '../components/library/LibraryProgressModal'
import { EmptyState } from '../components/ui/EmptyState'
import { EmptyStateIconBook } from '../components/ui/emptyStateIcons'
import { useBookSearch } from '../hooks/useBookSearch'
import { useMyLibraryIndex } from '../hooks/useMyLibraryIndex'
import { formatResultsSummary } from '../lib/formatSearchCount'
import { buildLibraryProgressPatch, pageEditorFromEntry } from '../lib/libraryProgress'
import { isIsbnQuery } from '../lib/isbn'
import type { BookHit } from '../types/bookSearch'
import type { LibraryEntry, LibraryPageEditorState } from '../types/library'

export function BookSearchPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setInputValue((prev) => (prev === q ? prev : q))
  }, [searchParams])

  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [pageEditor, setPageEditor] = useState<LibraryPageEditorState | null>(null)
  const [pageEditorError, setPageEditorError] = useState<string | null>(null)

  const { local, google, meta, status, errorMessage, loadMore, minQueryLength } = useBookSearch(inputValue)
  const { findForHit, reload: reloadLibraryIndex } = useMyLibraryIndex(!!user)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = inputValue.trim()
    const current = searchParams.get('q') ?? ''
    if (q === current) {
      return
    }
    if (q) {
      setSearchParams({ q }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [inputValue, searchParams, setSearchParams])

  const hitKey = useCallback((hit: BookHit, source: 'local' | 'google') => {
    if (source === 'local' && hit.id != null) {
      return `local-${hit.id}`
    }
    return hit.googleVolumeId ?? `hit-${hit.titre}`
  }, [])

  const addToLibrary = useCallback(
    async (payload: { googleVolumeId?: string; livreId?: number }, statut: string, label: string) => {
      const key = payload.googleVolumeId ?? `local-${payload.livreId}`
      setBusyKey(key)
      setAddSuccess(null)
      try {
        await api.post('/library', {
          ...payload,
          statut,
          progression: null,
        })
        await reloadLibraryIndex()
        setAddSuccess(label)
        setTimeout(() => setAddSuccess(null), 3500)
      } finally {
        setBusyKey(null)
      }
    },
    [reloadLibraryIndex],
  )

  const updateLibraryEntry = useCallback(
    async (entryId: number, patch: { statut?: string; progression?: number | null }) => {
      setBusyKey(`entry-${entryId}`)
      try {
        await api.patch(`/library/${entryId}`, patch)
        await reloadLibraryIndex()
      } finally {
        setBusyKey(null)
      }
    },
    [reloadLibraryIndex],
  )

  const removeLibraryEntry = useCallback(
    async (entry: LibraryEntry) => {
      if (!window.confirm('Retirer ce livre de votre bibliothèque ?')) {
        return
      }
      setBusyKey(`entry-${entry.id}`)
      try {
        await api.delete(`/library/${entry.id}`)
        await reloadLibraryIndex()
      } finally {
        setBusyKey(null)
      }
    },
    [reloadLibraryIndex],
  )

  function openManage(entry: LibraryEntry) {
    setPageEditorError(null)
    setPageEditor(pageEditorFromEntry(entry))
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
    await updateLibraryEntry(pageEditor.entryId, result.patch)
    setPageEditor(null)
    setPageEditorError(null)
  }

  const trimmed = inputValue.trim()
  const isSearching = status === 'loading' || status === 'typing'
  const hasResults = local.length > 0 || google.length > 0
  const showEmpty =
    trimmed.length >= minQueryLength && status === 'success' && !hasResults && !errorMessage
  const showHint = trimmed.length > 0 && trimmed.length < minQueryLength
  const resultsSummary =
    hasResults && !isSearching
      ? formatResultsSummary(local.length, google.length, meta)
      : null
  const showSearchSpinner =
    trimmed.length >= minQueryLength && (status === 'loading' || status === 'typing')
  const hasActiveSearch = trimmed.length >= minQueryLength
  const idle = !hasActiveSearch

  function renderCard(hit: BookHit, source: 'local' | 'google') {
    const key = hitKey(hit, source)
    const libraryEntry = user ? findForHit(hit, source) : null
    const busy = busyKey === key || (libraryEntry != null && busyKey === `entry-${libraryEntry.id}`)

    return (
      <BookSearchResultCard
        key={key}
        hit={hit}
        source={source}
        libraryEntry={libraryEntry}
        busy={busy}
        onAdd={(statut) =>
          void addToLibrary(
            source === 'local' ? { livreId: hit.id! } : { googleVolumeId: hit.googleVolumeId },
            statut,
            hit.titre,
          )
        }
        onManage={() => libraryEntry && openManage(libraryEntry)}
        onRemove={() => libraryEntry && void removeLibraryEntry(libraryEntry)}
      />
    )
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-primary via-slate-900 to-indigo-950 p-6 text-primary-foreground shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
              Explorer
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Rechercher un livre</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
              Trouvez un titre par nom, auteur ou ISBN puis ajoutez-le directement à votre bibliothèque.
            </p>

            <div className="mt-6 max-w-2xl" role="search">
              <BookSearchField
                ref={inputRef}
                id="book-search-input"
                variant="search"
                label="Rechercher un livre"
                value={inputValue}
                onValueChange={setInputValue}
                loading={showSearchSpinner}
                placeholder="Titre, auteur ou ISBN…"
              />
              <div className="mt-2 min-h-5 text-xs text-slate-300">
                {showHint && (
                  <span>
                    Minimum {minQueryLength} caractères — encore {minQueryLength - trimmed.length}
                  </span>
                )}
                {isIsbnQuery(trimmed) && !showHint && (
                  <span className="inline-flex items-center gap-1">Recherche ISBN détectée</span>
                )}
                {resultsSummary && (
                  <span className="ml-2 font-medium text-white" role="status">
                    {resultsSummary}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" aria-live="polite">
          {errorMessage && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          )}

          {!meta.googleConfigured && hasActiveSearch && (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              La recherche étendue n’est pas activée sur ce serveur.
            </p>
          )}

          {idle && (
            <EmptyState
              icon={<EmptyStateIconBook />}
              title="Commencez votre recherche"
              description="Saisissez au moins deux caractères pour afficher des résultats."
              action={
                <Link
                  to="/library"
                  className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
                >
                  Voir ma bibliothèque
                </Link>
              }
            />
          )}

          {hasActiveSearch && (
            <div className="space-y-8">
              {isSearching && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <BookSearchSkeleton key={i} />
                  ))}
                </div>
              )}

              {local.length > 0 && !isSearching && (
                <BookSearchSection
                  id="search-local-heading"
                  title="Sur LetterBook"
                  count={local.length}
                  variant="community"
                  description="Ouvrages déjà présents avec fiches et activité de la communauté."
                >
                  {local.map((hit) => renderCard(hit, 'local'))}
                </BookSearchSection>
              )}

              {google.length > 0 && !isSearching && (
                <BookSearchSection
                  id="search-discover-heading"
                  title="À découvrir"
                  count={google.length}
                  variant="discover"
                  description="Ces titres seront enregistrés sur LetterBook au moment de l’ajout."
                >
                  {google.map((hit) => renderCard(hit, 'google'))}
                </BookSearchSection>
              )}

              {meta.googleHasMore && !isSearching && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={status === 'loadingMore'}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {status === 'loadingMore' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Chargement…
                      </>
                    ) : (
                      'Plus de résultats'
                    )}
                  </button>
                </div>
              )}

              {showEmpty && (
                <div className="py-10">
                  <EmptyState
                    icon={<SearchX className="h-5 w-5" aria-hidden />}
                    title="Aucun résultat"
                    description="Essayez une autre orthographe, un auteur différent ou un ISBN complet."
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {pageEditor && (
        <LibraryProgressModal
          editor={pageEditor}
          saving={busyKey === `entry-${pageEditor.entryId}`}
          error={pageEditorError}
          onChange={setPageEditor}
          onClose={() => {
            setPageEditor(null)
            setPageEditorError(null)
          }}
          onSave={() => void savePageProgress()}
        />
      )}

      {addSuccess && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white py-3 pl-4 pr-3 shadow-xl"
          role="status"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Check className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{addSuccess}</p>
            <p className="text-xs text-slate-500">Ajouté à la bibliothèque</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/library')}
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground"
          >
            Voir
          </button>
        </div>
      )}
    </>
  )
}
