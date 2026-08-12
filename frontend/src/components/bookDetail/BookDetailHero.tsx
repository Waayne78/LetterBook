import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, Loader2, Share2 } from "lucide-react";
import type { BookLivre, MyLibraryEntry } from "../../types/bookDetail";
import { BookDetailLibraryActions } from "./BookDetailLibraryActions";
import { BookDetailMetaStrip } from "./BookDetailMetaStrip";
import { RatingStars } from "./RatingStars";

type BookDetailHeroProps = {
  livre: BookLivre;
  noteMoyenne: number | null;
  nombreAvis: number;
  preview: boolean;
  libraryBadge?: string | null;
  isLoggedIn: boolean;
  myLibrary: MyLibraryEntry | null;
  addingLibrary: boolean;
  updatingLibrary: boolean;
  onAddToLibrary: (statut: string, progression?: number | null) => void;
  onUpdateLibrary: (patch: {
    statut?: string;
    progression?: number | null;
  }) => void;
  onRemoveFromLibrary: () => void;
  onShare: () => void;
};

export function BookDetailHero({
  livre,
  noteMoyenne,
  nombreAvis,
  preview,
  libraryBadge,
  isLoggedIn,
  myLibrary,
  addingLibrary,
  updatingLibrary,
  onAddToLibrary,
  onUpdateLibrary,
  onRemoveFromLibrary,
  onShare,
}: BookDetailHeroProps) {
  const cover = livre.couverture;
  const hasReviews = nombreAvis > 0;
  const busy = addingLibrary || updatingLibrary;
  const isWishlist = myLibrary?.statut === "a_lire";
  const inLibrary = myLibrary != null && !preview;

  function handleWishlistToggle() {
    if (!isLoggedIn || busy) {
      return;
    }
    if (isWishlist) {
      onRemoveFromLibrary();
      return;
    }
    if (inLibrary) {
      onUpdateLibrary({ statut: "a_lire" });
      return;
    }
    onAddToLibrary("a_lire");
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-surface-warm via-white to-white shadow-sm">
      {cover && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] blur-3xl"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      )}

      <div className="relative flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start md:gap-8 md:p-8">
        <div className="mx-auto shrink-0 md:mx-0">
          <div className="relative aspect-[3/4] w-32 overflow-hidden rounded-xl shadow-[4px_8px_24px_rgba(15,23,42,0.15)] ring-1 ring-slate-900/10 sm:w-40 md:w-44">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-muted">
                Pas de couverture
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="absolute right-4 top-4 flex items-center gap-1 sm:right-6 sm:top-5 md:right-8 md:top-8">
            {preview && (
              <span className="mr-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                Aperçu
              </span>
            )}
            {libraryBadge && !preview && !myLibrary && (
              <span className="mr-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {libraryBadge}
              </span>
            )}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleWishlistToggle}
                disabled={busy}
                title={isWishlist ? "Retirer de À lire" : "Ajouter à lire"}
                aria-pressed={isWishlist}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${
                  isWishlist
                    ? "bg-accent/10 text-accent hover:bg-accent/15"
                    : "text-slate-500 hover:bg-slate-100 hover:text-primary"
                }`}
              >
                {busy && (isWishlist || !inLibrary) ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : isWishlist ? (
                  <BookmarkCheck className="h-4 w-4" aria-hidden />
                ) : (
                  <Bookmark className="h-4 w-4" aria-hidden />
                )}
                <span className="sr-only">
                  {isWishlist ? "Retirer de À lire" : "Ajouter à lire"}
                </span>
              </button>
            ) : (
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                title="Connectez-vous pour ajouter à lire"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Bookmark className="h-4 w-4" aria-hidden />
                <span className="sr-only">Ajouter à lire</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onShare}
              title="Partager"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Partager</span>
            </button>
            <Link
              to="/search"
              title="Retour à la recherche"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="sr-only">Recherche</span>
            </Link>
          </div>

          <h1 className="text-center text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-left">
            {livre.titre}
          </h1>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <p className="text-base text-slate-600">{livre.auteur}</p>
            {livre.nombrePages != null && livre.nombrePages > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/95 px-2.5 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200/70">
                <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="tabular-nums">
                  {livre.nombrePages.toLocaleString("fr-FR")} pages
                </span>
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <RatingStars value={noteMoyenne ?? 0} size="md" />
            {hasReviews ? (
              <span className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {noteMoyenne?.toFixed(1)}
                </span>
                <span className="text-muted"> · {nombreAvis} avis</span>
              </span>
            ) : (
              <span className="text-sm text-muted">Pas encore d’avis</span>
            )}
          </div>

          <BookDetailMetaStrip livre={livre} />

          <div className="mt-4 border-t border-slate-100 pt-4">
            <BookDetailLibraryActions
              livre={livre}
              isPreview={preview}
              isLoggedIn={isLoggedIn}
              myLibrary={myLibrary}
              addingLibrary={addingLibrary}
              updatingLibrary={updatingLibrary}
              onAddToLibrary={onAddToLibrary}
              onUpdateLibrary={onUpdateLibrary}
              onRemoveFromLibrary={onRemoveFromLibrary}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
