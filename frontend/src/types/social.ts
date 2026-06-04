/** Amitié = abonnement mutuel (les deux se suivent). */
export type SocialRelationship = 'none' | 'following' | 'follower' | 'friends'

export type PublicUser = {
  id: number
  pseudo: string
  photo?: string | null
  bio?: string | null
  relationship?: SocialRelationship
}

export type ProfileSocial = {
  followersCount: number
  followingCount: number
  friendsCount: number
  relationship: SocialRelationship
}

export type MeSocialResponse = {
  following: PublicUser[]
  followers: PublicUser[]
  friends: PublicUser[]
  counts: { following: number; followers: number; friends: number }
}

export type NotificationItem = {
  id: number
  type: 'friend_request' | 'friend_accepted' | 'friend_mutual' | 'new_follower'
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export type NotificationsResponse = {
  items: NotificationItem[]
  unreadCount: number
}
