import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
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
  const [data, setData] = useState<BookDetailPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewSort, setReviewSort] = useState<ReviewSort>('recent')
  const [message, setMessage] = useState<string | null>(null)
  const [addingLibrary, setAddingLibrary] = useState(false)
  const [updatingLibrary, setUpdatingLibrary] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
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
    const list = [...data.avis]
    if (reviewSort === 'rating') {
      return list.sort((a, b) => b.note - a.note || b.id - a.id)
    }
    return list.sort((a, b) => {
      const da = a.datePublication ? new Date(a.datePublication).getTime() : 0
      const db = b.datePublication ? new Date(b.datePublication).getTime() : 0
      return db - da
    })
  }, [data, reviewSort])

  const addToLibrary = useCallback(
    async (statut: string) => {
      if (!user) {
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      setAddingLibrary(true)
      setMessage(null)
      try {
        const payload = googleVolumeId
          ? { googleVolumeId, statut, progression: null }
          : { livreId, statut, progression: null }
        await api.post('/library', payload)
        await reload()
        setMessage('Ajouté à votre bibliothèque.')
      } catch {
        setMessage('Impossible d’ajouter ce livre à la bibliothèque.')
      } finally {
        setAddingLibrary(false)
      }
    },
    [user, googleVolumeId, livreId, navigate, reload],
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
      } catch {
        setMessage('Impossible de mettre à jour la bibliothèque.')
      } finally {
        setUpdatingLibrary(false)
      }
    },
    [data?.myLibrary?.id, reload],
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
      setMessage('Livre retiré de votre bibliothèque.')
    } catch {
      setMessage('Impossible de retirer ce livre.')
    } finally {
      setUpdatingLibrary(false)
    }
  }, [data?.myLibrary?.id, reload])

  const submitReview = useCallback(
    async (note: number, contenu: string) => {
      if (!Number.isFinite(livreId)) {
        return
      }
      setMessage(null)
      try {
        await api.post('/reviews', { livreId, note, contenu })
        await reload()
        setMessage('Avis publié.')
      } catch {
        setMessage('Impossible de publier (déjà un avis ?).')
      }
    },
    [livreId, reload],
  )

  const updateReview = useCallback(
    async (reviewId: number, note: number, contenu: string) => {
      setMessage(null)
      try {
        await api.patch(`/reviews/${reviewId}`, { note, contenu })
        await reload()
        setMessage('Avis mis à jour.')
      } catch {
        setMessage('Impossible de modifier l’avis.')
      }
    },
    [reload],
  )

  const deleteReview = useCallback(
    async (reviewId: number) => {
      if (!window.confirm('Supprimer votre avis ?')) {
        return
      }
      try {
        await api.delete(`/reviews/${reviewId}`)
        await reload()
        setMessage('Avis supprimé.')
      } catch {
        setMessage('Impossible de supprimer l’avis.')
      }
    },
    [reload],
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
      /* ignore */
    }
  }, [])

  const sendComment = useCallback(
    async (avisId: number) => {
      const text = commentDrafts[avisId]?.trim()
      if (!text) {
        return
      }
      await api.post(`/reviews/${avisId}/comments`, { contenu: text })
      setCommentDrafts((d) => ({ ...d, [avisId]: '' }))
      await reload()
    },
    [commentDrafts, reload],
  )

  const shareBook = useCallback(async () => {
    const url = window.location.href
    const title = data?.livre.titre ?? 'Livre'
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url })
        setShareFeedback('Partagé.')
      } else {
        await navigator.clipboard.writeText(url)
        setShareFeedback('Lien copié.')
      }
      setTimeout(() => setShareFeedback(null), 3000)
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setShareFeedback('Lien copié.')
        setTimeout(() => setShareFeedback(null), 3000)
      } catch {
        setShareFeedback(null)
      }
    }
  }, [data?.livre.titre])

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
    message,
    addingLibrary,
    updatingLibrary,
    shareFeedback,
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
    shareBook,
  }
}
