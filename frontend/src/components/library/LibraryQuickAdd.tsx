import { useEffect, useRef, useState } from 'react'
import { BookMarked, BookOpenCheck, CheckCircle2, ChevronDown, Loader2, Plus } from 'lucide-react'

const options = [
  { value: 'a_lire', label: 'À lire', icon: BookMarked },
  { value: 'en_cours', label: 'En cours', icon: BookOpenCheck },
  { value: 'termine', label: 'Terminé', icon: CheckCircle2 },
] as const

type LibraryQuickAddProps = {
  busy: boolean
  onAdd: (statut: string) => void
}

export function LibraryQuickAdd({ busy, onAdd }: LibraryQuickAddProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(statut: string) {
    setOpen(false)
    onAdd(statut)
  }

  return (
    <div ref={rootRef} className="relative z-20 inline-flex items-center">
      <button
        type="button"
        disabled={busy}
        onClick={() => onAdd('a_lire')}
        className="inline-flex items-center gap-1.5 rounded-l-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="h-4 w-4" aria-hidden />
        )}
        Ajouter
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        aria-label="Choisir un autre statut"
        aria-expanded={open}
        className="inline-flex items-center rounded-r-xl border-l border-white/25 bg-accent px-2 py-2 text-accent-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 z-30 mb-2 min-w-[10.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-slate-100"
          role="menu"
        >
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                role="menuitem"
                onClick={() => pick(option.value)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-primary focus:outline-none focus-visible:bg-slate-50"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
