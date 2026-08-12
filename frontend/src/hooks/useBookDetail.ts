import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../components/ui/useToast'
import type { BookDetailPayload, NoteDistribution, ReviewSort } from '../types/bookDetail'

const emptyDistribution = (): NoteDistribution => ({
  '1': 0,
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
})

export function useBookDetail(id: string | undefined, volumeId: string | undefined) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<BookDetailPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewSort, setReviewSort] = useState<ReviewSort>('recent')
  const [addingLibrary, setAddingLibrary] = useState(false)
  const [updatingLibrary, setUpdatingLibrary] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})

  const reload = useCallback(async () => {
    if (!id && !volumeId) {
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { data: res } = volumeId
        ? await api.get<BookDetailPayload>(`/books/volume/${encodeURIComponent(volumeId)}`)
        : await api.get<BookDetailPayload>(`/books/${id}`)
      const payload: BookDetailPayload = {
        ...res,
        noteDistribution: res.noteDistribution ?? emptyDistribution(),
        myLibrary: res.myLibrary ?? null,
        related: res.related ?? [],
      }
      setData(payload)
      if (volumeId && payload.livre?.id != null) {
        navigate(`/books/${payload.livre.id}`, { replace: true })
      }
    } catch {
      setError('Livre introuvable.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id, volumeId, navigate])

  useEffect(() => {
    void reload()
  }, [reload])

  const livreId = data?.livre?.id ?? (id ? Number(id) : NaN)
  const isPreview = data?.preview === true || data?.livre?.id == null
  const googleVolumeId = data?.googleVolumeId ?? volumeId ?? data?.livre?.externalId ?? null

  const myReview = useMemo(() => {
    if (!user || !data) {
      return null
    }
    return data.avis.find((a) => a.user?.id === user.id) ?? null
  }, [data, user])

  const sortedReviews = useMemo(() => {
    if (!data) {
      return []
    }
    const list = data.avis.filter((a) => !user || a.user?.id !== user.id)
    if (reviewSort === 'rating') {
      return list.sort((a, b) => b.note - a.note || b.id - a.id)
    }
    return list.sort((a, b) => {
      const da = a.datePublication ? new Date(a.datePublication).getTime() : 0
      const db = b.datePublication ? new Date(b.datePublication).getTime() : 0
      return db - da
    })
  }, [data, reviewSort, user])

  const addToLibrary = useCallback(
    async (statut: string, progression: number | null = null) => {
      if (!user) {
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      setAddingLibrary(true)
      try {
        const payload = googleVolumeId
          ? { googleVolumeId, statut, progression }
          : { livreId, statut, progression }
        await api.post('/library', payload)
        await reload()
        toast({ title: 'Ajouté à votre bibliothèque.' })
      } catch {
        toast({
          title: 'Ajout impossible',
          description: 'Le livre n’a pas pu être ajouté à votre bibliothèque.',
          variant: 'error',
        })
      } finally {
        setAddingLibrary(false)
      }
    },
    [user, googleVolumeId, livreId, navigate, reload, toast],
  )

  const updateLibrary = useCallback(
    async (patch: { statut?: string; progression?: number | null }) => {
      const entryId = data?.myLibrary?.id
      if (!entryId) {
        return
      }
      setUpdatingLibrary(true)
      try {
        await api.patch(`/library/${entryId}`, patch)
        await reload()
        toast({ title: 'Bibliothèque mise à jour.' })
      } catch {
        toast({ title: 'Mise à jour impossible', variant: 'error' })
      } finally {
        setUpdatingLibrary(false)
      }
    },
    [data?.myLibrary?.id, reload, toast],
  )

  const removeFromLibrary = useCallback(async () => {
    const entryId = data?.myLibrary?.id
    if (!entryId) {
      return
    }
    if (!window.confirm('Retirer ce livre de votre bibliothèque ?')) {
      return
    }
    setUpdatingLibrary(true)
    try {
      await api.delete(`/library/${entryId}`)
      await reload()
      toast({ title: 'Livre retiré de votre bibliothèque.', variant: 'info' })
    } catch {
      toast({ title: 'Suppression impossible', variant: 'error' })
    } finally {
      setUpdatingLibrary(false)
    }
  }, [data?.myLibrary?.id, reload, toast])

  const submitReview = useCallback(
    async (note: number, contenu: string) => {
      if (!Number.isFinite(livreId)) {
        return
      }
      try {
        await api.post('/reviews', { livreId, note, contenu })
        await reload()
        toast({ title: 'Avis publié.' })
      } catch {
        toast({
          title: 'Publication impossible',
          description: 'Vous avez peut-être déjà publié un avis sur ce livre.',
          variant: 'error',
        })
      }
    },
    [livreId, reload, toast],
  )

  const updateReview = useCallback(
    async (reviewId: number, note: number, contenu: string) => {
      try {
        await api.patch(`/reviews/${reviewId}`, { note, contenu })
        await reload()
        toast({ title: 'Avis mis à jour.' })
      } catch {
        toast({ title: 'Modification impossible', variant: 'error' })
      }
    },
    [reload, toast],
  )

  const deleteReview = useCallback(
    async (reviewId: number) => {
      if (!window.confirm('Supprimer votre avis ?')) {
        return
      }
      try {
        await api.delete(`/reviews/${reviewId}`)
        await reload()
        toast({ title: 'Avis supprimé.', variant: 'info' })
      } catch {
        toast({ title: 'Suppression impossible', variant: 'error' })
      }
    },
    [reload, toast],
  )

  const toggleLike = useCallback(async (avisId: number) => {
    try {
      const { data: likeRes } = await api.post<{ liked: boolean; likesCount: number }>(
        `/reviews/${avisId}/like`,
      )
      setData((prev) => {
        if (!prev) {
          return prev
        }
        return {
          ...prev,
          avis: prev.avis.map((a) =>
            a.id === avisId ? { ...a, likedByMe: likeRes.liked, likesCount: likeRes.likesCount } : a,
          ),
        }
      })
    } catch {
        toast({ title: 'Impossible de mettre à jour le like', variant: 'error' })
    }
  }, [toast])

  const sendComment = useCallback(
    async (avisId: number) => {
      const text = commentDrafts[avisId]?.trim()
      if (!text) {
        return
      }
      try {
        await api.post(`/reviews/${avisId}/comments`, { contenu: text })
        setCommentDrafts((d) => ({ ...d, [avisId]: '' }))
        await reload()
        toast({ title: 'Commentaire publié.' })
      } catch {
        toast({
          title: 'Envoi impossible',
          description: 'Vérifiez la longueur du commentaire ou patientez quelques secondes.',
          variant: 'error',
        })
      }
    },
    [commentDrafts, reload, toast],
  )

  const reportReview = useCallback(async (avisId: number) => {
    await api.post(`/reviews/${avisId}/report`, { motif: 'Contenu inapproprié' })
  }, [])

  const reportComment = useCallback(async (commentId: number) => {
    await api.post(`/comments/${commentId}/report`, { motif: 'Contenu inapproprié' })
  }, [])

  const shareBook = useCallback(async () => {
    const url = window.location.href
    const title = data?.livre.titre ?? 'Livre'
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url })
        toast({ title: 'Livre partagé' })
      } else {
        await navigator.clipboard.writeText(url)
        toast({ title: 'Lien copié' })
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        toast({ title: 'Lien copié' })
      } catch {
        toast({ title: 'Partage impossible', variant: 'error' })
      }
    }
  }, [data?.livre.titre, toast])

  return {
    data,
    error,
    loading,
    isPreview,
    user,
    myReview,
    sortedReviews,
    reviewSort,
    setReviewSort,
    addingLibrary,
    updatingLibrary,
    commentDrafts,
    setCommentDrafts,
    reload,
    addToLibrary,
    updateLibrary,
    removeFromLibrary,
    submitReview,
    updateReview,
    deleteReview,
    toggleLike,
    sendComment,
    reportReview,
    reportComment,
    shareBook,
  }
}
