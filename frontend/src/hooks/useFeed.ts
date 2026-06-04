import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { FeedResponse, FeedScope } from '../types/feed'

export function useFeed(scope: FeedScope, enabled = true) {
  const [data, setData] = useState<FeedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!enabled) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get<FeedResponse>('/feed', { params: { scope } })
      setData(res)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401 && (scope === 'following' || scope === 'friends')) {
        setError('connect_required')
      } else {
        setError('Impossible de charger le fil.')
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [scope, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { data, error, loading, reload: load }
}
