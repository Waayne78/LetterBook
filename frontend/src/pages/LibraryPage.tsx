import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, Plus, Search } from 'lucide-react'
import { api } from '../api/client'
import { LibraryManageActions } from '../components/library/LibraryManageActions'
import { LibraryProgressModal } from '../components/library/LibraryProgressModal'
import { EmptyState } from '../components/ui/EmptyState'
import { EmptyStateIconBook } from '../components/ui/emptyStateIcons'
import { buildLibraryProgressPatch, libraryStatusBadgeClass, pageEditorFromEntry } from '../lib/libraryProgress'
import { tabButtonClass } from '../lib/tabStyles'
import type { LibraryEntry, LibraryPageEditorState } from '../types/library'

const tabs = [
  { key: '', label: 'Tous' },
  { key: 'a_lire', label: 'À lire' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'termine', label: 'Terminé' },
]

export function LibraryPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('')
  const [items, setItems] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [pageEditor, setPageEditor] = useState<LibraryPageEditorState | null>(null)
  const [pageEditorError, setPageEditorError] = useState<string | null>(null)

  const qs = useMemo(() => (tab ? `?statut=${encodeURIComponent(tab)}` : ''), [tab])

  useEffect(() => {
    if (searchParams.get('addBook') !== '1') {
      return
    }
    const q = searchParams.get('q')
    const target = q ? `/search?q=${encodeURIComponent(q)}` : '/search'
    navigate(target, { replace: true })
  }, [searchParams, navigate])

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<{ items: LibraryEntry[] }>(`/library${qs}`)
      setItems(data.items)
    } catch {
      setError('Impossible de charger la bibliothèque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when tab changes
  }, [tab])

  async function updateEntry(entryId: number, patch: { statut?: string; progression?: number | null }) {
    setUpdatingId(entryId)
    try {
      await api.patch(`/library/${entryId}`, patch)
      await reload()
    } finally {
      setUpdatingId(null)
    }
  }

  async function removeEntry(entryId: number) {
    if (!window.confirm('Retirer ce livre de votre bibliothèque ?')) {
      return
    }
    setUpdatingId(entryId)
    try {
      await api.delete(`/library/${entryId}`)
      await reload()
    } finally {
      setUpdatingId(null)
    }
  }

  function openPageEditor(row: LibraryEntry) {
    setPageEditorError(null)
    setPageEditor(pageEditorFromEntry(row))
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
    await updateEntry(pageEditor.entryId, result.patch)
    setPageEditor(null)
    setPageEditorError(null)
  }

  const emptyLibrary = !loading && items.length === 0
  const countByStatus = useMemo(() => {
    return items.reduce(
      (acc, row) => {
        acc.total += 1
        if (row.statut === 'a_lire') acc.a_lire += 1
        if (row.statut === 'en_cours') acc.en_cours += 1
        if (row.statut === 'termine') acc.termine += 1
        return acc
      },
      { total: 0, a_lire: 0, en_cours: 0, termine: 0 },
    )
  }, [items])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-primary via-slate-900 to-indigo-950 p-6 text-primary-foreground shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Lecture</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Ma bibliothèque</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
              Organisez vos lectures, suivez votre progression et retrouvez vos livres en un clin d’oeil.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-md shadow-orange-950/20 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter un livre
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <LibraryStatCard label="Total" value={countByStatus.total} />
        <LibraryStatCard label="À lire" value={countByStatus.a_lire} />
        <LibraryStatCard label="En cours" value={countByStatus.en_cours} />
        <LibraryStatCard label="Terminés" value={countByStatus.termine} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="tablist" aria-label="Filtrer par statut de lecture">
          {tabs.map((t) => (
            <button
              key={t.key || 'all'}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              id={`library-tab-${t.key || 'all'}`}
              onClick={() => setTab(t.key)}
              className={tabButtonClass(tab === t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="aspect-[3/4] rounded-xl bg-slate-200" />
                <div className="mt-3 h-4 w-4/5 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && emptyLibrary && (
          <EmptyState
            icon={<EmptyStateIconBook />}
            title="Votre bibliothèque est vide"
            description={
              tab
                ? 'Aucun livre dans cette catégorie. Essayez un autre filtre ou ajoutez un livre.'
                : 'Recherchez un titre, un auteur ou un ISBN pour commencer votre bibliothèque.'
            }
            action={
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <Search className="h-4 w-4" aria-hidden />
                Rechercher un livre
              </Link>
            }
          />
        )}

        {!loading && !emptyLibrary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((row) => (
              <article
                key={row.id}
                className={`group flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${updatingId === row.id ? 'opacity-60' : ''}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                  {row.livre?.couverture ? (
                    <img
                      src={row.livre.couverture}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
                      <BookOpen className="h-8 w-8 text-slate-300" aria-hidden />
                      <p className="text-xs">Pas de couverture</p>
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${libraryStatusBadgeClass(row.statut)}`}
                  >
                    {row.statutLabel}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  {row.livre?.id ? (
                    <Link
                      to={`/books/${row.livre.id}`}
                      className="line-clamp-2 text-lg font-semibold leading-snug text-primary hover:text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                    >
                      {row.livre.titre}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 text-lg font-semibold leading-snug text-primary">{row.livre?.titre}</p>
                  )}
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{row.livre?.auteur}</p>

                  {row.progression !== null && row.progression > 0 && (
                    <p className="mt-3 text-xs font-medium text-slate-500">Progression: {row.progression}%</p>
                  )}

                  <div className="mt-auto pt-3">
                    <LibraryManageActions
                      busy={updatingId === row.id}
                      onManage={() => openPageEditor(row)}
                      onRemove={() => void removeEntry(row.id)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pageEditor && (
        <LibraryProgressModal
          editor={pageEditor}
          saving={updatingId === pageEditor.entryId}
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

function LibraryStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
    </div>
  )
}
