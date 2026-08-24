<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Livre;
use App\Repository\LivreRepository;
use Doctrine\ORM\EntityManagerInterface;

final class LivreImportService
{
    public function __construct(
        private readonly LivreRepository $livreRepository,
        private readonly GoogleBooksService $googleBooksService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function importFromGoogleVolumeId(string $volumeId): Livre
    {
        $existing = $this->livreRepository->findOneBy(['externalId' => $volumeId]);
        if (null !== $existing) {
            return $this->enrichMetadataIfMissing($existing);
        }

        $item = $this->googleBooksService->fetchVolume($volumeId);
        if (null === $item) {
            throw new \InvalidArgumentException('Impossible de récupérer ce volume.');
        }

        $parsed = $this->googleBooksService->parseFetchedVolume($item);
        if (null === $parsed) {
            throw new \InvalidArgumentException('Réponse Google Books invalide.');
        }

        $livre = new Livre();
        $livre->setExternalId($volumeId);
        $this->applyParsedMetadata($livre, $parsed, fillCoreFields: true);

        $this->entityManager->persist($livre);
        $this->entityManager->flush();

        return $livre;
    }

    public function enrichMetadataIfMissing(Livre $livre): Livre
    {
        if ($this->hasCompleteMetadata($livre)) {
            return $livre;
        }

        $parsed = $this->fetchParsedMetadata($livre);
        if (null === $parsed) {
            return $livre;
        }

        $this->applyParsedMetadata($livre, $parsed, fillCoreFields: false);
        $this->entityManager->flush();

        return $livre;
    }

    private function hasCompleteMetadata(Livre $livre): bool
    {
        return null !== $livre->getNombrePages()
            && null !== $livre->getEditeur()
            && null !== $livre->getDatePublication()
            && null !== $livre->getLangue();
    }

    /** @return array<string, mixed>|null */
    private function fetchParsedMetadata(Livre $livre): ?array
    {
        $externalId = $livre->getExternalId();
        if (null !== $externalId && '' !== $externalId) {
            $item = $this->googleBooksService->fetchVolume($externalId);
            if (null !== $item) {
                return $this->googleBooksService->parseFetchedVolume($item);
            }
        }

        $isbn = $livre->getIsbn();
        if (null === $isbn || '' === $isbn) {
            return null;
        }

        $search = $this->googleBooksService->searchVolumes($isbn, 0, 1);
        if ([] === $search['items']) {
            return null;
        }

        return $search['items'][0];
    }

    /**
     * @param array<string, mixed> $parsed
     */
    private function applyParsedMetadata(Livre $livre, array $parsed, bool $fillCoreFields): void
    {
        if ($fillCoreFields) {
            $livre->setTitre(isset($parsed['titre']) && \is_string($parsed['titre']) && '' !== $parsed['titre']
                ? $parsed['titre']
                : 'Sans titre');
            $livre->setAuteur(isset($parsed['auteur']) && \is_string($parsed['auteur']) ? $parsed['auteur'] : '');
            if (isset($parsed['resume']) && \is_string($parsed['resume'])) {
                $livre->setResume($parsed['resume']);
            }
            if (isset($parsed['couverture']) && \is_string($parsed['couverture'])) {
                $livre->setCouverture($parsed['couverture']);
            }
            if (isset($parsed['genre']) && \is_string($parsed['genre'])) {
                $livre->setGenre($parsed['genre']);
            }
            if (isset($parsed['isbn']) && \is_string($parsed['isbn'])) {
                $livre->setIsbn($parsed['isbn']);
            }
        }

        if (null === $livre->getExternalId() && isset($parsed['googleVolumeId']) && \is_string($parsed['googleVolumeId'])) {
            $livre->setExternalId($parsed['googleVolumeId']);
        }

        if (null === $livre->getNombrePages() && isset($parsed['nombrePages']) && is_numeric($parsed['nombrePages'])) {
            $pages = (int) $parsed['nombrePages'];
            if ($pages > 0) {
                $livre->setNombrePages($pages);
            }
        }

        if (null === $livre->getDatePublication() && isset($parsed['datePublication']) && \is_string($parsed['datePublication']) && '' !== $parsed['datePublication']) {
            $livre->setDatePublication($parsed['datePublication']);
        }

        if (null === $livre->getEditeur() && isset($parsed['editeur']) && \is_string($parsed['editeur']) && '' !== $parsed['editeur']) {
            $livre->setEditeur($parsed['editeur']);
        }

        if (null === $livre->getLangue() && isset($parsed['langue']) && \is_string($parsed['langue']) && '' !== $parsed['langue']) {
            $livre->setLangue($parsed['langue']);
        }

        if ($fillCoreFields || null === $livre->getResume()) {
            if (isset($parsed['resume']) && \is_string($parsed['resume']) && '' !== $parsed['resume']) {
                $livre->setResume($parsed['resume']);
            }
        }

        if (null === $livre->getCouverture() && isset($parsed['couverture']) && \is_string($parsed['couverture'])) {
            $livre->setCouverture($parsed['couverture']);
        }

        if (null === $livre->getGenre() && isset($parsed['genre']) && \is_string($parsed['genre'])) {
            $livre->setGenre($parsed['genre']);
        }
    }
}
