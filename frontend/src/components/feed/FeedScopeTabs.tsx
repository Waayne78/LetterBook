import type { FeedScope } from '../../types/feed'

const tabs: { key: FeedScope; label: string; title: string }[] = [
  { key: 'following', label: 'Pour vous', title: 'Activité des personnes que vous suivez' },
  { key: 'friends', label: 'Amis', title: 'Abonnement réciproque — vous vous suivez mutuellement' },
  { key: 'community', label: 'Communauté', title: 'Toute l’activité publique sur LetterBook' },
]

type FeedScopeTabsProps = {
  value: FeedScope
  onChange: (scope: FeedScope) => void
}

export function FeedScopeTabs({ value, onChange }: FeedScopeTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
      role="tablist"
      aria-label="Fil d’actualité"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          title={tab.title}
          aria-label={`${tab.label} — ${tab.title}`}
          onClick={() => onChange(tab.key)}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            value === tab.key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
