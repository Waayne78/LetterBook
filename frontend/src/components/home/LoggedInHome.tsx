import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { UserMe } from '../../auth/auth-context'
import { HomeFeed } from '../feed/HomeFeed'
import type { FeedResponse } from '../../types/feed'
import type { MeSocialResponse, PublicUser } from '../../types/social'
import { HomeQuickActions } from './HomeQuickActions'
import { HomeSidebar } from './HomeSidebar'
import { HomeWelcomeHero } from './HomeWelcomeHero'

export function LoggedInHome({ user }: { user: UserMe }) {
  const [social, setSocial] = useState<MeSocialResponse | null>(null)
  const [feedPreview, setFeedPreview] = useState<FeedResponse | null>(null)
  const [suggestions, setSuggestions] = useState<PublicUser[]>([])

  useEffect(() => {
    void api.get<MeSocialResponse>('/me/social').then((res) => setSocial(res.data)).catch(() => setSocial(null))
    void api.get<FeedResponse>('/feed', { params: { scope: 'community' } }).then((res) => setFeedPreview(res.data))
    void api
      .get<{ users: PublicUser[] }>('/users/suggestions')
      .then((res) => setSuggestions(res.data.users))
      .catch(() => setSuggestions([]))
  }, [])

  return (
    <div className="space-y-10 pb-8">
      <HomeWelcomeHero user={user} social={social} />
      <HomeQuickActions />

      <div className="grid gap-10 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <HomeFeed
            embedded
            title="Votre fil"
            subtitle="Activité des personnes que vous suivez et de vos amis."
          />
        </div>
        <HomeSidebar feedPreview={feedPreview} suggestions={suggestions} />
      </div>
    </div>
  )
}
