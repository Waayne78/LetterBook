<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Livre;
use App\Entity\User;
use App\Entity\Avis;
use App\Entity\Bibliotheque;
use App\Repository\AvisRepository;
use App\Repository\BibliothequeRepository;
use App\Repository\LivreRepository;
use App\Service\ApiNormalizer;
use App\Service\GoogleBooksService;
use App\Util\IsbnHelper;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class BookController extends AbstractController
{
    private const int PAGE_SIZE = 20;

    public function __construct(
        private readonly LivreRepository $livreRepository,
        private readonly AvisRepository $avisRepository,
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly GoogleBooksService $googleBooksService,
        private readonly ApiNormalizer $normalizer,
    ) {
    }

    #[Route('/api/books/search', name: 'api_books_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->query->getString('q'));
        $legacyIsbn = trim($request->query->getString('isbn'));
        if ($legacyIsbn !== '' && $q === '') {
            $q = $legacyIsbn;
        }

        $startIndex = max(0, $request->query->getInt('startIndex', 0));

        $local = [];
        $localExternalIds = [];
        $localIsbns = [];

        if ($q !== '') {
            $isbnNorm = IsbnHelper::normalize($q);
            $qb = $this->livreRepository->createQueryBuilder('l');
            $likeQ = '%'.mb_strtolower($q).'%';
            if ($isbnNorm !== null) {
                $qb->where('l.isbn = :isbnExact OR l.isbn LIKE :isbnPartial')
                    ->orWhere('LOWER(l.titre) LIKE :q OR LOWER(l.auteur) LIKE :q')
                    ->setParameter('isbnExact', $isbnNorm)
                    ->setParameter('isbnPartial', '%'.$isbnNorm.'%')
                    ->setParameter('q', $likeQ);
            } else {
                $qb->where('LOWER(l.titre) LIKE :q OR LOWER(l.auteur) LIKE :q')
                    ->setParameter('q', $likeQ);
                $digitsOnly = preg_replace('/[^0-9Xx]/', '', $q) ?? '';
                if ($digitsOnly !== '') {
                    $qb->orWhere('l.isbn LIKE :isbnPartial')
                        ->setParameter('isbnPartial', '%'.$digitsOnly.'%');
                }
            }
            $qb->setMaxResults(20);

            $localEntities = $qb->getQuery()->getResult();
            foreach ($localEntities as $livre) {
                if (!$livre instanceof Livre) {
                    continue;
                }
                $normalized = $this->normalizer->livre($livre);
                $local[] = $normalized;
                $ext = $livre->getExternalId();
                if ($ext !== null && $ext !== '') {
                    $localExternalIds[$ext] = true;
                }
                $livreIsbn = $livre->getIsbn();
                if ($livreIsbn !== null && $livreIsbn !== '') {
                    $norm = IsbnHelper::normalize($livreIsbn);
                    if ($norm !== null) {
                        $localIsbns[$norm] = true;
                    }
                }
            }
        }

        $googleResult = $this->googleBooksService->searchVolumes($q, $startIndex, self::PAGE_SIZE);
        $googleItems = $googleResult['items'];

        if ($startIndex === 0 && $googleItems !== []) {
            $googleItems = array_values(array_filter(
                $googleItems,
                static function (array $item) use ($localExternalIds, $localIsbns): bool {
                    $volumeId = $item['googleVolumeId'] ?? '';
                    if ($volumeId !== '' && isset($localExternalIds[$volumeId])) {
                        return false;
                    }
                    $isbn = $item['isbn'] ?? null;
                    if (\is_string($isbn) && $isbn !== '') {
                        $norm = IsbnHelper::normalize($isbn);
                        if ($norm !== null && isset($localIsbns[$norm])) {
                            return false;
                        }
                    }

                    return true;
                },
            ));
        }

        $totalItems = $googleResult['totalItems'];
        $pageSize = $googleResult['pageSize'];
        $nextStart = $startIndex + $pageSize;
        $googleHasMore = $googleResult['error'] === null
            && $totalItems > 0
            && $nextStart < $totalItems;

        return $this->json([
            'local' => $local,
            'google' => $googleItems,
            'meta' => [
                'googleConfigured' => $this->googleBooksService->isConfigured(),
                'googleTotalItems' => $totalItems,
                'googleStartIndex' => $googleResult['startIndex'],
                'googlePageSize' => $pageSize,
                'googleHasMore' => $googleHasMore,
                'googleError' => $googleResult['error'],
            ],
        ]);
    }

    #[Route('/api/books/volume/{volumeId}', name: 'api_books_show_volume', requirements: ['volumeId' => '.+'], methods: ['GET'])]
    public function showVolume(string $volumeId): JsonResponse
    {
        $existing = $this->livreRepository->findOneBy(['externalId' => $volumeId]);
        if ($existing instanceof Livre) {
            $payload = $this->buildBookPayload($existing);
            $payload['preview'] = false;
            $payload['googleVolumeId'] = $volumeId;

            return $this->json($payload);
        }

        $item = $this->googleBooksService->fetchVolume($volumeId);
        if ($item === null) {
            return $this->json(['error' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $parsed = $this->googleBooksService->parseFetchedVolume($item);
        if ($parsed === null) {
            return $this->json(['error' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $genre = isset($parsed['genre']) && \is_string($parsed['genre']) ? $parsed['genre'] : null;
        $related = $this->buildRelatedBooks($genre, 0);

        return $this->json([
            'livre' => [
                'id' => null,
                'titre' => $parsed['titre'],
                'auteur' => $parsed['auteur'],
                'resume' => $parsed['resume'],
                'couverture' => $parsed['couverture'],
                'genre' => $genre,
                'isbn' => $parsed['isbn'],
                'externalId' => $volumeId,
            ],
            'stats' => [
                'noteMoyenne' => null,
                'nombreAvis' => 0,
            ],
            'avis' => [],
            'noteDistribution' => $this->buildNoteDistribution([]),
            'myLibrary' => null,
            'related' => $related,
            'preview' => true,
            'googleVolumeId' => $volumeId,
        ]);
    }

    #[Route('/api/books/{id}', name: 'api_books_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $livre = $this->livreRepository->find($id);
        if ($livre === null) {
            return $this->json(['error' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->buildBookPayload($livre));
    }

    /** @return array<string, mixed> */
    private function buildBookPayload(Livre $livre): array
    {
        $viewer = $this->getUser();
        $viewerUser = $viewer instanceof User ? $viewer : null;

        $avisList = $this->avisRepository->findBy(['livre' => $livre], ['datePublication' => 'DESC'], 50);
        $avisData = [];
        foreach ($avisList as $a) {
            $avisData[] = $this->normalizer->avis($a, true, $viewerUser);
        }

        $notes = array_map(static fn ($a) => $a->getNote(), $avisList);
        $avg = \count($notes) > 0 ? round(array_sum($notes) / \count($notes), 1) : null;

        $myLibrary = null;
        if ($viewerUser !== null) {
            $entry = $this->bibliothequeRepository->findOneByUserAndLivre($viewerUser, $livre);
            if ($entry instanceof Bibliotheque) {
                $myLibrary = $this->normalizer->bibliotheque($entry);
            }
        }

        return [
            'livre' => $this->normalizer->livre($livre),
            'stats' => [
                'noteMoyenne' => $avg,
                'nombreAvis' => \count($avisList),
            ],
            'avis' => $avisData,
            'noteDistribution' => $this->buildNoteDistribution($avisList),
            'myLibrary' => $myLibrary,
            'related' => $this->buildRelatedBooks($livre->getGenre(), $livre->getId() ?? 0),
            'preview' => false,
        ];
    }

    /**
     * @param list<Avis> $avisList
     *
     * @return array<string, int>
     */
    private function buildNoteDistribution(array $avisList): array
    {
        $dist = ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0];
        foreach ($avisList as $avis) {
            if (!$avis instanceof Avis) {
                continue;
            }
            $n = $avis->getNote();
            if ($n >= 1 && $n <= 5) {
                $dist[(string) $n]++;
            }
        }

        return $dist;
    }

    /** @return list<array<string, mixed>> */
    private function buildRelatedBooks(?string $genre, int $excludeId): array
    {
        $related = [];
        if ($excludeId > 0) {
            foreach ($this->livreRepository->findRelatedByGenre($genre, $excludeId, 4) as $l) {
                if ($l instanceof Livre) {
                    $related[] = $this->normalizer->livre($l);
                }
            }
        } elseif ($genre !== null && trim($genre) !== '') {
            $candidates = $this->livreRepository->findBy(['genre' => $genre], ['id' => 'DESC'], 4);
            foreach ($candidates as $l) {
                if ($l instanceof Livre) {
                    $related[] = $this->normalizer->livre($l);
                }
            }
        }

        return $related;
    }
}
