import type { BookLivre } from './bookDetail'

export type FeedScope = 'following' | 'friends' | 'community'

export type FeedUser = {
  id: number
  pseudo: string
  photo?: string | null
}

export type FeedReviewItem = {
  type: 'review'
  at: string
  user: FeedUser | null
  avis: {
    id: number
    note: number
    contenu: string
    datePublication: string
    likesCount?: number
  }
  livre: BookLivre | null
}

export type FeedLibraryItem = {
  type: 'library_add' | 'library_status'
  at: string
  user: FeedUser | null
  livre: BookLivre | null
  statut: string
  statutLabel: string
  progression?: number | null
}

export type FeedItem = FeedReviewItem | FeedLibraryItem

export type FeedResponse = {
  items: FeedItem[]
  meta: { hasMore: boolean; nextCursor: string | null }
  avisRecents?: unknown[]
  livresPopulaires: Array<{ livreId: number; titre: string; cnt: string | number; couverture?: string | null }>
}
