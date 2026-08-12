const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'Anglais',
  es: 'Espagnol',
  de: 'Allemand',
  it: 'Italien',
  pt: 'Portugais',
  nl: 'Néerlandais',
  ru: 'Russe',
  ja: 'Japonais',
  zh: 'Chinois',
}

export function formatBookLanguage(code: string | null | undefined): string | null {
  if (!code || code.trim() === '') {
    return null
  }
  const normalized = code.trim().toLowerCase()
  return LANGUAGE_LABELS[normalized] ?? code.toUpperCase()
}

export function formatPublicationDate(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === '') {
    return null
  }
  const value = raw.trim()
  if (/^\d{4}$/.test(value)) {
    return value
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-')
    const monthIndex = Number(month) - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
        new Date(Number(year), monthIndex, 1),
      )
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
    }
  }
  return value
}

export function estimateReadingTimeMinutes(pages: number | null | undefined): number | null {
  if (pages == null || pages <= 0) {
    return null
  }
  return Math.max(15, Math.round(pages * 1.8))
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) {
    return `${hours} h`
  }
  return `${hours} h ${rest} min`
}

export function currentPageFromProgress(
  progression: number | null | undefined,
  totalPages: number | null | undefined,
): number | null {
  if (
    progression == null ||
    totalPages == null ||
    totalPages <= 0 ||
    progression <= 0
  ) {
    return null
  }
  return Math.min(totalPages, Math.max(1, Math.round((progression / 100) * totalPages)))
}

export function formatIsbn(isbn: string | null | undefined): string | null {
  if (!isbn || isbn.trim() === '') {
    return null
  }
  const digits = isbn.replace(/[^0-9Xx]/g, '')
  if (digits.length === 13) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 12)}-${digits.slice(12)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  return isbn
}
