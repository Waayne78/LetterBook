export type BookLivre = {
  id: number | null
  titre: string
  auteur: string
  resume: string | null
  couverture: string | null
  genre: string | null
  isbn: string | null
  externalId?: string | null
}

export type MyLibraryEntry = {
  id: number
  statut: string
  statutLabel: string
  progression: number | null
  livre: BookLivre | null
}

export type BookReview = {
  id: number
  note: number
  contenu: string
  datePublication: string
  user?: { id: number; pseudo: string; photo?: string | null }
  likesCount?: number
  commentsCount?: number
  likedByMe?: boolean
  commentaires?: Array<{
    id: number
    contenu: string
    datePublication: string
    user?: { id: number; pseudo: string }
  }>
}

export type NoteDistribution = Record<'1' | '2' | '3' | '4' | '5', number>

export type BookDetailPayload = {
  livre: BookLivre
  stats: { noteMoyenne: number | null; nombreAvis: number }
  avis: BookReview[]
  noteDistribution: NoteDistribution
  myLibrary: MyLibraryEntry | null
  related: BookLivre[]
  preview?: boolean
  googleVolumeId?: string
}

export type ReviewSort = 'recent' | 'rating'
