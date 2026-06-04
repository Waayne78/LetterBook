/** Styles pour onglets segmentés (bibliothèque, etc.) — focus clavier + état actif */
export function tabButtonClass(active: boolean): string {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100',
  ].join(' ')
}
