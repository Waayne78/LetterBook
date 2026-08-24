import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}

export type ToastContextValue = {
  toast: (input: ToastInput) => number
  dismissToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
