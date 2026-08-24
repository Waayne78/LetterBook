export function BookSearchSkeleton() {
  return (
    <li className="flex min-h-44 animate-pulse items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-32 w-[5.75rem] shrink-0 rounded-xl bg-slate-200 sm:h-36 sm:w-[6.5rem]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/4 max-w-xs rounded bg-slate-200" />
        <div className="h-3 w-1/2 max-w-[10rem] rounded bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
    </li>
  )
}
