import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { BookHit } from '../types/bookSearch'
import type { LibraryEntry } from '../types/library'

export function useMyLibraryIndex(enabled: boolean) {
  const [items, setItems] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enabled) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get<{ items: LibraryEntry[] }>('/library')
      setItems(data.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const findForHit = useCallback(
    (hit: BookHit, source: 'local' | 'google'): LibraryEntry | null => {
      if (source === 'local' && hit.id != null) {
        return items.find((entry) => entry.livre?.id === hit.id) ?? null
      }
      if (hit.googleVolumeId) {
        return items.find((entry) => entry.livre?.externalId === hit.googleVolumeId) ?? null
      }
      return null
    },
    [items],
  )

  const byLivreId = useMemo(() => {
    const map = new Map<number, LibraryEntry>()
    for (const entry of items) {
      const livreId = entry.livre?.id
      if (livreId != null) {
        map.set(livreId, entry)
      }
    }
    return map
  }, [items])

  return { items, loading, reload, findForHit, byLivreId }
}
