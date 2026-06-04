export function normalizeIsbn(raw: string): string | null {
  const digits = raw.replace(/[^0-9Xx]/gi, '').toUpperCase()
  if (digits.length === 10 || digits.length === 13) {
    return digits
  }
  return null
}

export function isIsbnQuery(query: string): boolean {
  return normalizeIsbn(query.trim()) !== null
}
