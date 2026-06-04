export type BookHit = {
  id?: number
  googleVolumeId?: string
  titre: string
  auteur: string
  couverture: string | null
  resume?: string | null
  genre?: string | null
  isbn?: string | null
  externalId?: string | null
}

export type BookSearchMeta = {
  googleConfigured: boolean
  googleTotalItems: number
  googleStartIndex: number
  googlePageSize: number
  googleHasMore: boolean
  googleError: string | null
}

export type BookSearchResponse = {
  local: BookHit[]
  google: BookHit[]
  meta: BookSearchMeta
}

export type BookSearchStatus = 'idle' | 'typing' | 'loading' | 'loadingMore' | 'success' | 'error'
