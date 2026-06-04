import type { BookHit } from '../types/bookSearch'

export function bookDetailPath(hit: BookHit, source: 'local' | 'google'): string | null {
  if (source === 'local' && hit.id != null) {
    return `/books/${hit.id}`
  }
  if (hit.googleVolumeId) {
    return `/books/v/${encodeURIComponent(hit.googleVolumeId)}`
  }
  if (hit.externalId) {
    return `/books/v/${encodeURIComponent(hit.externalId)}`
  }
  return null
}
