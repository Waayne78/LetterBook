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
        if ($existing !== null) {
            return $existing;
        }

        $item = $this->googleBooksService->fetchVolume($volumeId);
        if ($item === null) {
            throw new \InvalidArgumentException('Impossible de récupérer ce volume.');
        }

        $volumeInfo = $item['volumeInfo'] ?? [];
        if (!\is_array($volumeInfo)) {
            throw new \InvalidArgumentException('Réponse Google Books invalide.');
        }

        $livre = new Livre();
        $livre->setExternalId($volumeId);
        $livre->setTitre(isset($volumeInfo['title']) ? (string) $volumeInfo['title'] : 'Sans titre');

        $authors = $volumeInfo['authors'] ?? [];
        $livre->setAuteur(\is_array($authors) ? implode(', ', $authors) : '');

        $livre->setResume(isset($volumeInfo['description']) ? (string) $volumeInfo['description'] : null);

        $thumb = $volumeInfo['imageLinks']['thumbnail'] ?? $volumeInfo['imageLinks']['smallThumbnail'] ?? null;
        $livre->setCouverture(\is_string($thumb) ? str_replace('http://', 'https://', $thumb) : null);

        $categories = $volumeInfo['categories'] ?? [];
        $livre->setGenre(\is_array($categories) && isset($categories[0]) ? (string) $categories[0] : null);

        $industry = $volumeInfo['industryIdentifiers'] ?? [];
        $isbn = null;
        if (\is_array($industry)) {
            foreach ($industry as $iden) {
                if (!\is_array($iden)) {
                    continue;
                }
                $type = $iden['type'] ?? '';
                if ($type === 'ISBN_13' || $type === 'ISBN_10') {
                    $isbn = isset($iden['identifier']) ? (string) $iden['identifier'] : null;
                    break;
                }
            }
        }
        $livre->setIsbn($isbn);

        $this->entityManager->persist($livre);
        $this->entityManager->flush();

        return $livre;
    }
}
