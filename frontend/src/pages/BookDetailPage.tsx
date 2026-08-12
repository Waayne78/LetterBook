import { Link, useParams } from 'react-router-dom'
import { BookDetailHero } from '../components/bookDetail/BookDetailHero'
import { BookDetailSkeleton } from '../components/bookDetail/BookDetailSkeleton'
import { BookDetailSummary } from '../components/bookDetail/BookDetailSummary'
import { NoteDistribution } from '../components/bookDetail/NoteDistribution'
import { RelatedBooks } from '../components/bookDetail/RelatedBooks'
import { ReviewCard } from '../components/bookDetail/ReviewCard'
import { ReviewComposer } from '../components/bookDetail/ReviewComposer'
import { EmptyState } from '../components/ui/EmptyState'
import { EmptyStateIconChat } from '../components/ui/emptyStateIcons'
import { useBookDetail } from '../hooks/useBookDetail'
import type { ReviewSort } from '../types/bookDetail'

const sortTabs: { key: ReviewSort; label: string }[] = [
  { key: 'recent', label: 'Récents' },
  { key: 'rating', label: 'Mieux notés' },
]

export function BookDetailPage() {
  const { id, volumeId } = useParams()
  const {
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
  } = useBookDetail(id, volumeId)

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700" role="alert">
        {error}
      </p>
    )
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl">
        <BookDetailSkeleton />
      </div>
    )
  }

  const libraryBadge = data.myLibrary?.statutLabel ?? null
  const breadcrumbFrom = user ? (
    <Link to="/library" className="hover:text-primary hover:underline">
      Bibliothèque
    </Link>
  ) : (
    <Link to="/search" className="hover:text-primary hover:underline">
      Recherche
    </Link>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        {breadcrumbFrom}
        <span className="mx-2 text-slate-300">/</span>
        <span className="truncate text-slate-800" title={data.livre.titre}>
          {data.livre.titre}
        </span>
      </nav>

      <BookDetailHero
        livre={data.livre}
        noteMoyenne={data.stats.noteMoyenne}
        nombreAvis={data.stats.nombreAvis}
        preview={isPreview}
        libraryBadge={libraryBadge}
        isLoggedIn={!!user}
        myLibrary={data.myLibrary}
        addingLibrary={addingLibrary}
        updatingLibrary={updatingLibrary}
        onAddToLibrary={(s, progression) => void addToLibrary(s, progression ?? null)}
        onUpdateLibrary={(p) => void updateLibrary(p)}
        onRemoveFromLibrary={() => void removeFromLibrary()}
        onShare={() => void shareBook()}
      />

      {isPreview && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-950">
          Fiche en aperçu : les avis de la communauté apparaîtront une fois le livre enregistré sur LetterBook.
        </div>
      )}

      <BookDetailSummary resume={data.livre.resume} />

      {!isPreview && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notes de la communauté</h2>
          <div className="mt-4">
            <NoteDistribution
              distribution={data.noteDistribution}
              average={data.stats.noteMoyenne}
              totalReviews={data.stats.nombreAvis}
            />
          </div>
        </section>
      )}

      {user && !isPreview && (
        <ReviewComposer
          existingReview={myReview}
          onSubmit={submitReview}
          onUpdate={updateReview}
          onDelete={deleteReview}
        />
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-primary">Avis</h2>
          {!isPreview && data.avis.length > 0 && (
            <div className="flex rounded-xl border border-slate-200 p-0.5" role="tablist" aria-label="Trier les avis">
              {sortTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={reviewSort === tab.key}
                  onClick={() => setReviewSort(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    reviewSort === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {sortedReviews.map((a) => (
          <ReviewCard
            key={a.id}
            review={a}
            isLoggedIn={!!user}
            commentDraft={commentDrafts[a.id] ?? ''}
            onCommentDraftChange={(v) => setCommentDrafts((d) => ({ ...d, [a.id]: v }))}
            onToggleLike={() => void toggleLike(a.id)}
            onSendComment={() => void sendComment(a.id)}
            onReportReview={() => reportReview(a.id)}
            onReportComment={(commentId) => reportComment(commentId)}
          />
        ))}

        {data.avis.length === 0 && !isPreview && (
          <EmptyState
            icon={<EmptyStateIconChat />}
            title="Pas encore d’avis"
            description="Soyez le premier à partager votre avis sur ce livre."
            action={
              user ? (
                <p className="text-sm text-slate-600">Utilisez le formulaire ci-dessus pour publier.</p>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-95"
                >
                  Se connecter pour avis
                </Link>
              )
            }
          />
        )}
      </section>

      <RelatedBooks books={data.related} />
    </div>
  )
}
