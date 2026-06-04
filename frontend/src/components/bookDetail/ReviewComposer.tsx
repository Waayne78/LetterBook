import { type FormEvent, useEffect, useState } from 'react'
import type { BookReview } from '../../types/bookDetail'
import { RatingStars } from './RatingStars'

type ReviewComposerProps = {
  existingReview: BookReview | null
  disabled?: boolean
  message: string | null
  onSubmit: (note: number, contenu: string) => Promise<void>
  onUpdate: (reviewId: number, note: number, contenu: string) => Promise<void>
  onDelete: (reviewId: number) => Promise<void>
}

export function ReviewComposer({
  existingReview,
  disabled,
  message,
  onSubmit,
  onUpdate,
  onDelete,
}: ReviewComposerProps) {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(5)
  const [contenu, setContenu] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (existingReview) {
      setNote(existingReview.note)
      setContenu(existingReview.contenu)
    }
  }, [existingReview])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!contenu.trim()) {
      return
    }
    setSubmitting(true)
    try {
      if (existingReview && editing) {
        await onUpdate(existingReview.id, note, contenu.trim())
        setEditing(false)
      } else if (!existingReview) {
        await onSubmit(note, contenu.trim())
        setContenu('')
        setNote(5)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (existingReview && !editing) {
    return (
      <section className="rounded-2xl border border-primary/20 bg-surface-warm/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Votre avis</h2>
        <div className="mt-2">
          <RatingStars value={existingReview.note} size="sm" />
        </div>
        <p className="mt-3 text-sm text-slate-700">{existingReview.contenu}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => void onDelete(existingReview.id)}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Supprimer
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {existingReview && editing ? 'Modifier votre avis' : 'Publier un avis'}
      </h2>
      <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <span className="text-sm text-slate-700">Votre note</span>
          <div className="mt-1">
            <RatingStars value={note} interactive onChange={setNote} label="Choisir une note" />
          </div>
        </div>
        <label className="block text-sm text-slate-700">
          Votre avis
          <textarea
            required
            disabled={disabled || submitting}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
        {message && (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={disabled || submitting}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-95 disabled:opacity-60"
          >
            {existingReview && editing ? 'Enregistrer' : 'Publier'}
          </button>
          {existingReview && editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setNote(existingReview.note)
                setContenu(existingReview.contenu)
              }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
