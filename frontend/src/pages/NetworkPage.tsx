import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { tabButtonClass } from '../lib/tabStyles'
import { UserAvatar } from '../components/ui/UserAvatar'
import type { MeSocialResponse } from '../types/social'

const tabs = [
  { key: 'following', label: 'Abonnements' },
  { key: 'followers', label: 'Abonnés' },
  { key: 'friends', label: 'Amis' },
] as const

type TabKey = (typeof tabs)[number]['key']

function tabFromQuery(param: string | null): TabKey {
  if (param === 'following' || param === 'followers' || param === 'friends') {
    return param
  }
  return 'friends'
}

export function NetworkPage() {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<MeSocialResponse | null>(null)
  const [tab, setTab] = useState<TabKey>(() => tabFromQuery(searchParams.get('tab')))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    void api
      .get<MeSocialResponse>('/me/social')
      .then((res) => setData(res.data))
      .catch(() => setError('Impossible de charger votre réseau.'))
  }, [])

  if (error) {
    return <p className="text-red-700">{error}</p>
  }

  if (!data) {
    return <p className="text-slate-600">Chargement…</p>
  }

  const list =
    tab === 'following' ? data.following : tab === 'followers' ? data.followers : data.friends

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Mon réseau</h1>
        <p className="mt-1 text-slate-600">
          {data.counts.following} abonnements · {data.counts.followers} abonnés · {data.counts.friends} amis
        </p>
        <p className="mt-2 text-sm text-muted">
          Vous êtes amis avec les personnes qui vous suivent et que vous suivez en retour.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={tabButtonClass(tab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {list.length === 0 && (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-muted">
            {tab === 'friends'
              ? 'Aucun ami pour l’instant. Abonnez-vous à des lecteurs qui vous suivent aussi.'
              : 'Liste vide.'}
          </li>
        )}
        {list.map((u) => (
          <li key={u.id}>
            <Link
              to={`/profiles/${u.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
            >
              <UserAvatar pseudo={u.pseudo} photo={u.photo} className="h-10 w-10" />
              <span className="font-semibold text-slate-900">@{u.pseudo}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link to="/discover" className="inline-block text-sm font-semibold text-primary hover:underline">
        Découvrir de nouveaux lecteurs →
      </Link>
    </div>
  )
}
