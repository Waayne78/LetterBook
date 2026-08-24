import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext, type ToastInput, type ToastVariant } from './toast-context'

type ToastItem = ToastInput & {
  id: number
  variant: ToastVariant
}

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle2; iconClass: string; borderClass: string }> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    borderClass: 'border-emerald-200',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'bg-red-50 text-red-600 ring-red-100',
    borderClass: 'border-red-200',
  },
  info: {
    icon: Info,
    iconClass: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    borderClass: 'border-indigo-200',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current
      nextId.current += 1
      const item: ToastItem = {
        ...input,
        id,
        variant: input.variant ?? 'success',
      }
      setToasts((current) => [...current.slice(-2), item])
      const timer = window.setTimeout(() => dismissToast(id), input.duration ?? (item.variant === 'error' ? 5500 : 4000))
      timers.current.set(id, timer)
      return id
    },
    [dismissToast],
  )

  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      currentTimers.forEach((timer) => window.clearTimeout(timer))
      currentTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast, dismissToast }), [toast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-4 right-4 z-[100] flex flex-col items-stretch gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[22rem]"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((item) => {
          const style = variantStyles[item.variant]
          const Icon = style.icon
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex gap-3 rounded-2xl border bg-white p-4 shadow-[0_18px_50px_-16px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 ${style.borderClass}`}
              role={item.variant === 'error' ? 'alert' : 'status'}
            >
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${style.iconClass}`}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                {item.description && <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>}
                {item.action && (
                  <button
                    type="button"
                    onClick={() => {
                      item.action?.onClick()
                      dismissToast(item.id)
                    }}
                    className="mt-2 text-xs font-bold text-link hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
