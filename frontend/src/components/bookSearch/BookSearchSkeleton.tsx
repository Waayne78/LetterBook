export function BookSearchSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[3/4] bg-slate-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-8 rounded-lg bg-slate-100" />
          <div className="h-8 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
