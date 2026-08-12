import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookMarked,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Plus,
  Search,
} from 'lucide-react'
import { api } from '../api/client'
import { LibraryManageActions } from '../components/library/LibraryManageActions'
import { LibraryProgressModal } from '../components/library/LibraryProgressModal'
import { EmptyState } from '../components/ui/EmptyState'
import { EmptyStateIconBook } from '../components/ui/emptyStateIcons'
import { useToast } from '../components/ui/useToast'
import { buildLibraryProgressPatch, libraryStatusBadgeClass, pageEditorFromEntry } from '../lib/libraryProgress'
import type { LibraryEntry, LibraryPageEditorState } from '../types/library'

const tabs = [
  { key: '', label: 'Tous', icon: BookOpen },
  { key: 'a_lire', label: 'À lire', icon: BookMarked },
  { key: 'en_cours', label: 'En cours', icon: BookOpenCheck },
  { key: 'termine', label: 'Terminé', icon: CheckCircle2 },
] as const

type TabKey = (typeof tabs)[number]['key']

function tabFromQuery(param: string | null): TabKey {
  if (param === 'a_lire' || param === 'en_cours' || param === 'termine') {
    return param
  }
  return ''
}

function countForTab(items: LibraryEntry[], key: TabKey): number {
  if (key === '') {
    return items.length
  }
  return items.filter((row) => row.statut === key).length
}

export function LibraryPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tab, setTab] = useState<TabKey>(() => tabFromQuery(searchParams.get('statut')))
  const [items, setItems] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [pageEditor, setPageEditor] = useState<LibraryPageEditorState | null>(null)
  const [pageEditorError, setPageEditorError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('addBook') !== '1') {
      return
    }
    const q = searchParams.get('q')
    const target = q ? `/search?q=${encodeURIComponent(q)}` : '/search'
    navigate(target, { replace: true })
  }, [searchParams, navigate])

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('statut')))
  }, [searchParams])

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<{ items: LibraryEntry[] }>('/library')
      setItems(data.items)
    } catch {
      setError('Impossible de charger la bibliothèque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const filteredItems = useMemo(() => {
    if (tab === '') {
      return items
    }
    return items.filter((row) => row.statut === tab)
  }, [items, tab])

  const counts = useMemo(
    () => ({
      total: items.length,
      a_lire: items.filter((row) => row.statut === 'a_lire').length,
      en_cours: items.filter((row) => row.statut === 'en_cours').length,
      termine: items.filter((row) => row.statut === 'termine').length,
    }),
    [items],
  )

  async function updateEntry(entryId: number, patch: { statut?: string; progression?: number | null }) {
    setUpdatingId(entryId)
    try {
      await api.patch(`/library/${entryId}`, patch)
      await reload()
      return true
    } catch {
      toast({ title: 'Mise à jour impossible', description: 'Réessayez dans quelques instants.', variant: 'error' })
      return false
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
    } catch {
      toast({ title: 'Suppression impossible', description: 'Le livre n’a pas pu être retiré.', variant: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  function openPageEditor(row: LibraryEntry) {
    setPageEditorError(null)
    setPageEditor(pageEditorFromEntry(row, row.livre?.nombrePages))
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
    const ok = await updateEntry(pageEditor.entryId, result.patch)
    if (!ok) {
      return
    }
    setPageEditor(null)
    setPageEditorError(null)
  }

  function selectTab(next: TabKey) {
    setTab(next)
    navigate(next ? `/library?statut=${next}` : '/library', { replace: true })
  }

  const emptyLibrary = !loading && items.length === 0
  const emptyFilter = !loading && items.length > 0 && filteredItems.length === 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Ma bibliothèque</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {loading ? (
              'Chargement de vos livres…'
            ) : (
              <>
                <span className="font-medium text-slate-800">
                  {counts.total} livre{counts.total !== 1 ? 's' : ''}
                </span>
                {' · '}
                {counts.en_cours} en cours
                {' · '}
                {counts.a_lire} à lire
                {' · '}
                {counts.termine} terminé{counts.termine !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter un livre
        </Link>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div
          className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:grid-cols-4"
          role="tablist"
          aria-label="Filtrer par statut de lecture"
        >
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            const count = countForTab(items, t.key)
            return (
              <button
                key={t.key || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                id={`library-tab-${t.key || 'all'}`}
                onClick={() => selectTab(t.key)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:justify-center sm:gap-2 sm:px-4 ${
                  active ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-xs font-semibold sm:text-sm">{t.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums sm:text-xs ${
                    active ? 'bg-primary/10 text-primary' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {loading ? '—' : count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="aspect-[3/4] bg-slate-200" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-4/5 rounded bg-slate-200" />
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && emptyLibrary && (
            <EmptyState
              icon={<EmptyStateIconBook />}
              title="Votre bibliothèque est vide"
              description="Recherchez un titre, un auteur ou un ISBN pour commencer votre bibliothèque."
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

          {!loading && emptyFilter && (
            <EmptyState
              icon={<EmptyStateIconBook />}
              title="Aucun livre dans cette catégorie"
              description="Essayez un autre filtre ou ajoutez un nouveau livre à votre bibliothèque."
              action={
                <button
                  type="button"
                  onClick={() => selectTab('')}
                  className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Voir tous les livres
                </button>
              }
            />
          )}

          {!loading && filteredItems.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((row) => (
                <LibraryBookCard
                  key={row.id}
                  row={row}
                  busy={updatingId === row.id}
                  onManage={() => openPageEditor(row)}
                  onRemove={() => void removeEntry(row.id)}
                />
              ))}
            </div>
          )}
        </div>
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

function LibraryBookCard({
  row,
  busy,
  onManage,
  onRemove,
}: {
  row: LibraryEntry
  busy: boolean
  onManage: () => void
  onRemove: () => void
}) {
  const progress = row.progression ?? 0
  const showProgress = row.statut === 'en_cours' && progress > 0

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${busy ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        {row.livre?.id ? (
          <Link to={`/books/${row.livre.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
            {row.livre.couverture ? (
              <img
                src={row.livre.couverture}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                <BookOpen className="h-8 w-8" aria-hidden />
                <p className="text-xs">Pas de couverture</p>
              </div>
            )}
          </Link>
        ) : row.livre?.couverture ? (
          <img src={row.livre.couverture} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <BookOpen className="h-8 w-8" aria-hidden />
            <p className="text-xs">Pas de couverture</p>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${libraryStatusBadgeClass(row.statut)}`}
        >
          {row.statutLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {row.livre?.id ? (
          <Link
            to={`/books/${row.livre.id}`}
            className="line-clamp-2 font-semibold leading-snug text-slate-900 transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            {row.livre.titre}
          </Link>
        ) : (
          <p className="line-clamp-2 font-semibold leading-snug text-slate-900">{row.livre?.titre}</p>
        )}
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{row.livre?.auteur}</p>

        {showProgress && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Progression</span>
              <span className="font-semibold tabular-nums text-amber-800">{progress} %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}

        {row.statut === 'termine' && (
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Lecture terminée
          </p>
        )}

        <div className="mt-auto pt-4">
          <LibraryManageActions busy={busy} onManage={onManage} onRemove={onRemove} />
        </div>
      </div>
    </article>
  )
}
