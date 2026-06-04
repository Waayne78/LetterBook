import type { BookLivre } from './bookDetail'

export type LibraryEntry = {
  id: number
  statut: string
  statutLabel: string
  progression: number | null
  livre: BookLivre | null
}

export type LibraryPageEditorState = {
  entryId: number
  title: string
  statut: string
  current: string
  total: string
}
