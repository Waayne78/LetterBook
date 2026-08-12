import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, Hash, Library, Loader2, Search, SearchX, UserRound } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { BookSearchResultRow } from '../components/bookSearch/BookSearchResultRow'
import { BookSearchResultsGroup } from '../components/bookSearch/BookSearchResultsGroup'
import { BookSearchSkeleton } from '../components/bookSearch/BookSearchSkeleton'
import { LibraryProgressModal } from '../components/library/LibraryProgressModal'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/useToast'
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
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setInputValue((prev) => (prev === q ? prev : q))
  }, [searchParams])

  const [busyKey, setBusyKey] = useState<string | null>(null)
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
      try {
        await api.post('/library', {
          ...payload,
          statut,
          progression: null,
        })
        await reloadLibraryIndex()
        toast({
          title: 'Livre ajouté à la bibliothèque',
          description: label,
          action: { label: 'Voir ma bibliothèque', onClick: () => navigate('/library') },
        })
      } catch {
        toast({ title: 'Ajout impossible', variant: 'error' })
      } finally {
        setBusyKey(null)
      }
    },
    [reloadLibraryIndex, navigate, toast],
  )

  const updateLibraryEntry = useCallback(
    async (entryId: number, patch: { statut?: string; progression?: number | null }) => {
      setBusyKey(`entry-${entryId}`)
      try {
        await api.patch(`/library/${entryId}`, patch)
        await reloadLibraryIndex()
        toast({ title: 'Bibliothèque mise à jour' })
      } catch {
        toast({ title: 'Mise à jour impossible', variant: 'error' })
      } finally {
        setBusyKey(null)
      }
    },
    [reloadLibraryIndex, toast],
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
        toast({ title: 'Livre retiré de la bibliothèque', variant: 'info' })
      } catch {
        toast({ title: 'Suppression impossible', variant: 'error' })
      } finally {
        setBusyKey(null)
      }
    },
    [reloadLibraryIndex, toast],
  )

  function openManage(entry: LibraryEntry) {
    setPageEditorError(null)
    setPageEditor(pageEditorFromEntry(entry, entry.livre?.nombrePages))
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

  function renderRow(hit: BookHit, source: 'local' | 'google') {
    const key = hitKey(hit, source)
    const libraryEntry = user ? findForHit(hit, source) : null
    const busy = busyKey === key || (libraryEntry != null && busyKey === `entry-${libraryEntry.id}`)

    return (
      <BookSearchResultRow
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
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" aria-hidden />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Catalogue</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Quel livre cherchez-vous&nbsp;?
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                  Explorez LetterBook et son catalogue étendu depuis une seule recherche.
                </p>
              </div>
              <Link
                to="/library"
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary/30 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Library className="h-4 w-4" aria-hidden />
                Ma bibliothèque
              </Link>
            </div>

            <label className="mt-7 block" role="search">
              <span className="sr-only">Rechercher un livre</span>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  ref={inputRef}
                  id="book-search-input"
                  type="search"
                  inputMode="search"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Rechercher un titre, un auteur ou un ISBN…"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-4 pl-14 pr-14 text-base font-medium text-slate-900 shadow-inner placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 md:text-lg"
                />
                {showSearchSpinner && (
                  <Loader2
                    className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400"
                    aria-hidden
                  />
                )}
              </div>
            </label>

            <div className="mt-3 flex min-h-5 flex-wrap items-center gap-2 text-xs text-slate-500">
              {showHint ? (
                <span>Encore {minQueryLength - trimmed.length} caractère pour lancer la recherche</span>
              ) : isIsbnQuery(trimmed) ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">ISBN détecté</span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" aria-hidden />Titre</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" aria-hidden />Auteur</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" aria-hidden />ISBN</span>
                </>
              )}
            </div>
          </div>
        </section>

        <div aria-live="polite">
          {errorMessage && (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          )}

          {!meta.googleConfigured && hasActiveSearch && (
            <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              La recherche étendue n’est pas activée sur ce serveur.
            </p>
          )}

          {idle && (
            <section className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
              <SearchGuide icon={<BookOpen className="h-5 w-5" aria-hidden />} title="Par titre" description="Retrouvez un ouvrage précis." />
              <SearchGuide icon={<UserRound className="h-5 w-5" aria-hidden />} title="Par auteur" description="Explorez toute une bibliographie." />
              <SearchGuide icon={<Hash className="h-5 w-5" aria-hidden />} title="Par ISBN" description="Identifiez la bonne édition." />
            </section>
          )}

          {hasActiveSearch && (
            <div className="space-y-10">
              {!isSearching && hasResults && (
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Résultats</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      Pour «&nbsp;{trimmed}&nbsp;»
                    </h2>
                  </div>
                  {resultsSummary && <p className="text-sm text-slate-500">{resultsSummary}</p>}
                </div>
              )}

              {isSearching && (
                <ul className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <BookSearchSkeleton key={i} />
                  ))}
                </ul>
              )}

              {local.length > 0 && !isSearching && (
                <BookSearchResultsGroup id="search-local-heading" title="Sur LetterBook" count={local.length}>
                  {local.map((hit) => renderRow(hit, 'local'))}
                </BookSearchResultsGroup>
              )}

              {google.length > 0 && !isSearching && (
                <BookSearchResultsGroup id="search-discover-heading" title="Catalogue étendu" count={google.length}>
                  {google.map((hit) => renderRow(hit, 'google'))}
                </BookSearchResultsGroup>
              )}

              {meta.googleHasMore && !isSearching && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={status === 'loadingMore'}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {status === 'loadingMore' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Chargement…
                      </>
                    ) : (
                      'Afficher plus de livres'
                    )}
                  </button>
                </div>
              )}

              {showEmpty && (
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <EmptyState
                    icon={<SearchX className="h-6 w-6" strokeWidth={1.5} aria-hidden />}
                    title="Aucun résultat"
                    description="Essayez une autre orthographe, un auteur différent ou un ISBN complet."
                  />
                </div>
              )}
            </div>
          )}
        </div>
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

    </>
  )
}

function SearchGuide({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 md:p-6">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  )
}
