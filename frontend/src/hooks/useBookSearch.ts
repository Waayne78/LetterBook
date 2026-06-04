import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { BookHit, BookSearchMeta, BookSearchResponse, BookSearchStatus } from '../types/bookSearch'

const DEBOUNCE_MS = 350
const MIN_QUERY_LENGTH = 2

const defaultMeta: BookSearchMeta = {
  googleConfigured: true,
  googleTotalItems: 0,
  googleStartIndex: 0,
  googlePageSize: 20,
  googleHasMore: false,
  googleError: null,
}

export function useBookSearch(query: string) {
  const [local, setLocal] = useState<BookHit[]>([])
  const [google, setGoogle] = useState<BookHit[]>([])
  const [meta, setMeta] = useState<BookSearchMeta>(defaultMeta)
  const [status, setStatus] = useState<BookSearchStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryRef = useRef(query)

  const trimmed = query.trim()

  const fetchSearch = useCallback(async (q: string, startIndex: number, append: boolean) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus(append ? 'loadingMore' : 'loading')
    setErrorMessage(null)

    try {
      const { data } = await api.get<BookSearchResponse>('/books/search', {
        params: { q, startIndex },
        signal: controller.signal,
      })

      if (controller.signal.aborted || queryRef.current.trim() !== q) {
        return
      }

      setLocal(data.local)
      setGoogle((prev) => (append ? [...prev, ...data.google] : data.google))
      setMeta(data.meta)
      setStatus('success')
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        return
      }
      const canceled =
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'ERR_CANCELED'
      if (canceled) {
        return
      }
      setErrorMessage('Impossible de charger les résultats. Réessayez dans un instant.')
      setStatus('error')
      if (!append) {
        setLocal([])
        setGoogle([])
        setMeta(defaultMeta)
      }
    }
  }, [])

  useEffect(() => {
    queryRef.current = query

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort()
      setLocal([])
      setGoogle([])
      setMeta(defaultMeta)
      setErrorMessage(null)
      setStatus(trimmed.length === 0 ? 'idle' : 'typing')
      return
    }

    setStatus('typing')
    debounceRef.current = setTimeout(() => {
      void fetchSearch(trimmed, 0, false)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [trimmed, fetchSearch])

  const loadMore = useCallback(() => {
    if (trimmed.length < MIN_QUERY_LENGTH || !meta.googleHasMore || status === 'loadingMore') {
      return
    }
    const nextStart = meta.googleStartIndex + meta.googlePageSize
    void fetchSearch(trimmed, nextStart, true)
  }, [trimmed, meta, status, fetchSearch])

  return {
    local,
    google,
    meta,
    status,
    errorMessage,
    loadMore,
    minQueryLength: MIN_QUERY_LENGTH,
  }
}
