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

export function pageEditorFromEntry(entry: LibraryEntry): LibraryPageEditorState {
  return {
    entryId: entry.id,
    title: entry.livre?.titre ?? 'Livre',
    statut: entry.statut,
    current: String(entry.progression ?? 0),
    total: '100',
  }
}

export function buildLibraryProgressPatch(
  editor: LibraryPageEditorState,
): { ok: true; patch: { statut: string; progression?: number | null } } | { ok: false; error: string } {
  if (editor.statut !== 'en_cours') {
    return { ok: true, patch: { statut: editor.statut } }
  }

  const current = Number(editor.current)
  const total = Number(editor.total)

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0 || current < 0 || current > total) {
    return { ok: false, error: 'Renseignez des pages valides (ex. 45 / 320).' }
  }

  return {
    ok: true,
    patch: {
      statut: editor.statut,
      progression: Math.round((current / total) * 100),
    },
  }
}
