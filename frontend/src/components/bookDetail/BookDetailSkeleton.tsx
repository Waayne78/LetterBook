export function BookDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true">
      <div className="h-4 w-48 rounded bg-slate-200" />
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:gap-10">
          <div className="mx-auto aspect-[3/4] w-40 rounded-xl bg-slate-200 md:mx-0 md:w-48" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
            <div className="h-5 w-1/2 rounded bg-slate-100" />
            <div className="h-4 w-1/3 rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="h-32 rounded-2xl bg-slate-100" />
      <div className="space-y-4">
        <div className="h-6 w-32 rounded bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}
