import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { NotificationsResponse } from '../types/social'

export function useNotifications(enabled: boolean) {
  const [data, setData] = useState<NotificationsResponse | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) {
      return
    }
    try {
      const { data: res } = await api.get<NotificationsResponse>('/me/notifications')
      setData(res)
    } catch {
      setData(null)
    }
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const markRead = useCallback(
    async (id: number) => {
      await api.patch(`/me/notifications/${id}/read`)
      await reload()
    },
    [reload],
  )

  const markAllRead = useCallback(async () => {
    await api.post('/me/notifications/read-all')
    await reload()
  }, [reload])

  return { data, reload, markRead, markAllRead, unreadCount: data?.unreadCount ?? 0 }
}
