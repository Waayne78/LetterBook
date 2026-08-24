import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from './toast-context'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast doit être utilisé dans ToastProvider.')
  }
  return context
}
