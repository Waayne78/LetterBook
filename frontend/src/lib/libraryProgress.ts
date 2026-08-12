import type { LibraryEntry, LibraryPageEditorState } from '../types/library'

export const libraryStatutOptions = [
  { value: 'a_lire', label: 'À lire' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
] as const

export function libraryStatusBadgeClass(statut: string): string {
  if (statut === 'en_cours') return 'bg-amber-100 text-amber-900'
  if (statut === 'termine') return 'bg-emerald-100 text-emerald-900'
  return 'bg-indigo-100 text-indigo-900'
}

export function pageEditorFromEntry(
  entry: LibraryEntry,
  totalPages?: number | null,
): LibraryPageEditorState {
  const hasRealPages = totalPages != null && totalPages > 0
  const total = hasRealPages ? String(totalPages) : '100'
  const progression = entry.progression ?? 0
  let current: string
  if (entry.statut === 'en_cours' && hasRealPages) {
    const fromProgress = Math.round((progression / 100) * totalPages!)
    // Jamais page 0 : on démarre au minimum à la page 1
    current = String(Math.min(totalPages!, Math.max(1, fromProgress || 1)))
  } else {
    current = String(Math.max(0, progression))
  }

  return {
    entryId: entry.id,
    title: entry.livre?.titre ?? 'Livre',
    statut: entry.statut,
    current,
    total,
  }
}

export function createEnCoursPageEditor(
  title: string,
  totalPages?: number | null,
  entryId = 0,
): LibraryPageEditorState {
  const hasRealPages = totalPages != null && totalPages > 0
  return {
    entryId,
    title,
    statut: 'en_cours',
    current: '1',
    total: hasRealPages ? String(totalPages) : '100',
  }
}

export function buildLibraryProgressPatch(
  editor: LibraryPageEditorState,
): { ok: true; patch: { statut: string; progression?: number | null } } | { ok: false; error: string } {
  if (editor.statut !== 'en_cours') {
    return { ok: true, patch: { statut: editor.statut, progression: null } }
  }

  const current = Number(editor.current)
  const total = Number(editor.total)

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0 || current < 0 || current > total) {
    return { ok: false, error: 'Renseignez des pages valides (ex. 45 / 320).' }
  }

  // Dernière page atteinte → lecture terminée
  if (current >= total) {
    return {
      ok: true,
      patch: {
        statut: 'termine',
        progression: null,
      },
    }
  }

  return {
    ok: true,
    patch: {
      statut: editor.statut,
      progression: Math.round((current / total) * 100),
    },
  }
}

/** True when the page input reaches the book total (auto-complete). */
export function isReadingComplete(editor: LibraryPageEditorState): boolean {
  if (editor.statut !== 'en_cours') {
    return false
  }
  const current = Number(editor.current)
  const total = Number(editor.total)
  return Number.isFinite(current) && Number.isFinite(total) && total > 0 && current >= total
}
