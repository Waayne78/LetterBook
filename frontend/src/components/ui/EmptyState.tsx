import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center"
      role="status"
    >
      {icon !== undefined && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-slate-200">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-600">{description}</p>
      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  )
}
