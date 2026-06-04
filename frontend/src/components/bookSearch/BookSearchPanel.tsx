import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Library } from 'lucide-react'
import { BookSearchField } from './BookSearchField'

const QUICK = [
  { label: 'SF', q: 'science-fiction' },
  { label: 'Thriller', q: 'thriller' },
  { label: 'BD', q: 'bande dessinée' },
  { label: 'ISBN', q: '978' },
] as const

type BookSearchPanelProps = {
  inputRef: RefObject<HTMLInputElement | null>
  value: string
  onValueChange: (v: string) => void
  loading: boolean
  showHint: boolean
  minQueryLength: number
  trimmedLength: number
  isIsbn: boolean
  resultsSummary: string | null
  totalResults: number
}

export function BookSearchPanel({
  inputRef,
  value,
  onValueChange,
  loading,
  showHint,
  minQueryLength,
  trimmedLength,
  isIsbn,
  resultsSummary,
  totalResults,
}: BookSearchPanelProps) {
  return (
    <aside className="flex flex-col bg-zinc-950 text-zinc-100 lg:w-[22rem] lg:shrink-0 xl:w-[26rem]">
      <div className="border-b border-zinc-800 px-5 py-4 lg:px-6">
        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Bibliothèque
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6 lg:px-6 lg:py-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Library className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Explorer</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white xl:text-[1.65rem] xl:leading-tight">
          Recherche
          <span className="block text-zinc-500">de livres</span>
        </h1>

        <div className="mt-8" role="search">
          <BookSearchField
            ref={inputRef}
            id="book-search-input"
            variant="search"
            label="Rechercher"
            value={value}
            onValueChange={onValueChange}
            loading={loading}
            placeholder="Titre, auteur, ISBN…"
          />

          <div className="mt-3 min-h-5 space-y-2 text-xs text-zinc-500">
            {showHint && (
              <p>
                Minimum {minQueryLength} caractères — encore{' '}
                {minQueryLength - trimmedLength}
              </p>
            )}
            {isIsbn && !showHint && <p className="font-medium text-accent">Recherche ISBN détectée</p>}
            {resultsSummary && (
              <p className="font-medium text-zinc-300" role="status">
                {resultsSummary}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Raccourcis</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((item) => (
              <button
                key={item.q}
                type="button"
                onClick={() => onValueChange(item.q)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto hidden pt-10 lg:block">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs leading-relaxed text-zinc-500">
              {totalResults > 0
                ? `${totalResults} titre${totalResults > 1 ? 's' : ''} dans le panneau de droite. Cliquez sur une couverture pour la fiche complète.`
                : 'Les résultats s’affichent à droite. Ajoutez un livre à votre bibliothèque sans quitter cette page.'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
