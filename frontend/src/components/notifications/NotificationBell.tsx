import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { formatRelativeDate } from '../../lib/formatRelativeDate'
import type { NotificationItem } from '../../types/social'

function notificationLabel(n: NotificationItem): string {
  const user = n.payload.user as { pseudo?: string } | undefined
  const pseudo = user?.pseudo ?? 'Quelqu’un'
  switch (n.type) {
    case 'friend_request':
    case 'friend_accepted':
      return `Notification archivée concernant ${pseudo}`
    case 'friend_mutual':
      return `Vous et ${pseudo} êtes maintenant amis`
    case 'new_follower':
      return `${pseudo} s’est abonné à votre profil`
    default:
      return 'Nouvelle notification'
  }
}

export function NotificationBell() {
  const { user } = useAuth()
  const { data, markRead, markAllRead, unreadCount } = useNotifications(!!user)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick)
    }
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (!user) {
    return null
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {(data?.items ?? []).length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">Aucune notification</li>
            )}
            {(data?.items ?? []).map((n) => {
              const fromUser = n.payload.user as { id?: number; pseudo?: string } | undefined
              return (
                <li
                  key={n.id}
                  className={`border-b border-slate-50 px-4 py-3 text-sm ${n.readAt ? 'bg-white' : 'bg-accent-soft/40'}`}
                >
                  <p className="text-slate-800">{notificationLabel(n)}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{formatRelativeDate(n.createdAt)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fromUser?.id && (
                      <Link
                        to={`/profiles/${fromUser.id}`}
                        onClick={() => {
                          void markRead(n.id)
                          setOpen(false)
                        }}
                        className="text-xs font-medium text-link hover:underline"
                      >
                        Voir le profil
                      </Link>
                    )}
                    {!n.readAt && (
                      <button
                        type="button"
                        onClick={() => void markRead(n.id)}
                        className="text-xs text-muted hover:text-slate-700"
                      >
                        Marquer lu
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-slate-100 px-4 py-2">
            <Link
              to="/network"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Gérer mon réseau →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
