function discoverSourceLabel(hasMore: boolean, totalItems: number): string | null {
  if (hasMore) {
    return 'd’autres titres à parcourir'
  }
  if (totalItems > 0 && totalItems <= 10_000) {
    const n = new Intl.NumberFormat('fr-FR').format(totalItems)
    return `${n} correspondance${totalItems > 1 ? 's' : ''} à découvrir`
  }
  return null
}

export function formatResultsSummary(
  localCount: number,
  googleCount: number,
  meta: { googleConfigured: boolean; googleTotalItems: number; googleHasMore: boolean },
): string {
  const total = localCount + googleCount
  if (total === 0) {
    return ''
  }

  const head = `${total} résultat${total > 1 ? 's' : ''}`

  if (localCount > 0 && googleCount > 0) {
    return `${head} · ${localCount} sur LetterBook · ${googleCount} à découvrir`
  }

  if (localCount > 0) {
    return `${head} sur LetterBook`
  }

  if (googleCount > 0 && meta.googleConfigured) {
    const hint = discoverSourceLabel(meta.googleHasMore, meta.googleTotalItems)
    return hint ? `${head} · ${hint}` : head
  }

  return head
}
