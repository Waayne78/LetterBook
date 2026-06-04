import { useState } from 'react'
import { Loader2, UserPlus, UserCheck, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { api } from '../../api/client'
import type { SocialRelationship } from '../../types/social'

type FollowButtonProps = {
  userId: number
  relationship: SocialRelationship
  onChange: (relationship: SocialRelationship) => void
}

export function FollowButton({ userId, relationship, onChange }: FollowButtonProps) {
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isFollowing = relationship === 'following' || relationship === 'friends'

  async function toggle() {
    setBusy(true)
    try {
      if (isFollowing) {
        const { data } = await api.delete<{ relationship: SocialRelationship }>(`/users/${userId}/follow`)
        onChange(data.relationship)
      } else {
        const { data } = await api.post<{ relationship: SocialRelationship }>(`/users/${userId}/follow`)
        onChange(data.relationship)
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        const redirect = encodeURIComponent(location.pathname + location.search)
        navigate(`/login?redirect=${redirect}`)
        return
      }
      throw err
    } finally {
      setBusy(false)
    }
  }

  const label =
    relationship === 'friends'
      ? 'Ami · Abonné'
      : relationship === 'following'
        ? 'Abonné'
        : relationship === 'follower'
          ? 'S’abonner en retour'
          : 'S’abonner'

  const Icon =
    relationship === 'friends' ? Users : isFollowing ? UserCheck : UserPlus

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      title={
        relationship === 'friends'
          ? 'Abonnement mutuel — vous êtes amis'
          : relationship === 'follower'
            ? 'Cette personne vous suit ; abonnez-vous pour devenir amis'
            : undefined
      }
      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${
        relationship === 'friends'
          ? 'border border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
          : isFollowing
            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            : 'bg-primary text-primary-foreground hover:opacity-95'
      }`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  )
}
