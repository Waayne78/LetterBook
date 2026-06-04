import { forwardRef, type InputHTMLAttributes } from 'react'
import { Loader2, Search, X } from 'lucide-react'

type BookSearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  value: string
  onValueChange: (value: string) => void
  onClear?: () => void
  loading?: boolean
  id: string
  label: string
  variant?: 'default' | 'compact' | 'search'
}

export const BookSearchField = forwardRef<HTMLInputElement, BookSearchFieldProps>(
  function BookSearchField(
    {
      value,
      onValueChange,
      onClear,
      loading = false,
      id,
      label,
      variant = 'default',
      className = '',
      placeholder = 'Titre, auteur ou ISBN…',
      ...rest
    },
    ref,
  ) {
    const hasValue = value.length > 0
    const showClear = hasValue && !loading

    const shellClass =
      variant === 'compact'
        ? 'rounded-full border border-slate-200 bg-slate-50/90 shadow-inner focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20'
        : variant === 'search'
          ? 'rounded-2xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-200/70 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
          : 'rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'

    const inputClass =
      variant === 'compact'
        ? 'py-2.5 pl-10 pr-10 text-sm'
        : variant === 'search'
          ? 'py-3.5 pl-12 pr-11 text-base md:py-4 md:text-lg'
          : 'py-3 pl-11 pr-11 text-base'

    const iconLeft = variant === 'compact' ? 'left-3' : 'left-4'
    const iconSize = variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'
    const clearRight = variant === 'compact' ? 'right-2' : 'right-3'
    const iconColor = variant === 'search' ? 'text-slate-500' : 'text-slate-400'

    function handleClear() {
      onClear?.()
      onValueChange('')
    }

    return (
      <div className={`relative transition-all ${shellClass} ${className}`}>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <span className={`pointer-events-none absolute inset-y-0 ${iconLeft} flex items-center ${iconColor}`}>
          <Search className={iconSize} strokeWidth={2} aria-hidden />
        </span>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          role="searchbox"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full bg-transparent text-primary placeholder:text-slate-400 focus:outline-none ${inputClass}`}
          {...rest}
        />
        <div className={`absolute inset-y-0 ${clearRight} flex items-center`}>
          {loading && (
            <span className="flex p-2 text-slate-400" aria-hidden>
              <Loader2 className={`${iconSize} animate-spin`} />
            </span>
          )}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Effacer la recherche"
            >
              <X className={iconSize} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </div>
    )
  },
)
