<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Avis;
use App\Entity\Bibliotheque;
use App\Repository\AvisRepository;
use App\Repository\BibliothequeRepository;

final class FeedTimelineService
{
    private const int LIMIT = 30;

    public function __construct(
        private readonly AvisRepository $avisRepository,
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly ApiNormalizer $normalizer,
    ) {
    }

    /**
     * @param list<int> $userIds
     *
     * @return array{items: list<array<string, mixed>>, meta: array{hasMore: bool, nextCursor: string|null}}
     */
    public function buildForUserIds(array $userIds, ?string $cursor = null): array
    {
        $before = $this->parseCursor($cursor);
        $fetchLimit = self::LIMIT + 15;
        $avisList = $this->avisRepository->findRecentForUserIds($userIds, $fetchLimit, $before);
        $biblioList = $this->bibliothequeRepository->findRecentActivityForUserIds($userIds, $fetchLimit, $before);

        $items = [];

        foreach ($avisList as $avis) {
            if (!$avis instanceof Avis) {
                continue;
            }
            $user = $avis->getUser();
            $livre = $avis->getLivre();
            $items[] = [
                'type' => 'review',
                'at' => $avis->getDatePublication()->format(\DateTimeInterface::ATOM),
                'user' => $user ? $this->normalizer->userPublic($user) : null,
                'avis' => $this->normalizer->avis($avis),
                'livre' => $livre ? $this->normalizer->livre($livre) : null,
            ];
        }

        foreach ($biblioList as $entry) {
            if (!$entry instanceof Bibliotheque) {
                continue;
            }
            $user = $entry->getUser();
            $livre = $entry->getLivre();
            $created = $entry->getCreatedAt();
            $updated = $entry->getUpdatedAt();
            $isNew = $created->getTimestamp() === $updated->getTimestamp()
                || $updated->getTimestamp() - $created->getTimestamp() < 2;

            $items[] = [
                'type' => $isNew ? 'library_add' : 'library_status',
                'at' => $updated->format(\DateTimeInterface::ATOM),
                'user' => $user ? $this->normalizer->userPublic($user) : null,
                'livre' => $livre ? $this->normalizer->livre($livre) : null,
                'statut' => $entry->getStatut()->value,
                'statutLabel' => $entry->getStatut()->label(),
                'progression' => $entry->getProgression(),
            ];
        }

        usort($items, static fn (array $a, array $b) => strcmp($b['at'], $a['at']));

        $hasMore = \count($items) > self::LIMIT;
        $items = \array_slice($items, 0, self::LIMIT);
        $nextCursor = null;
        if ($hasMore && [] !== $items) {
            $last = $items[\count($items) - 1];
            $nextCursor = $last['at'];
        }

        return [
            'items' => $items,
            'meta' => ['hasMore' => $hasMore, 'nextCursor' => $nextCursor],
        ];
    }

    /**
     * @return array{items: list<array<string, mixed>>, meta: array{hasMore: bool, nextCursor: string|null}}
     */
    public function buildCommunity(?string $cursor = null): array
    {
        $before = $this->parseCursor($cursor);
        $avisList = $this->avisRepository->findRecent(self::LIMIT + 1, $before);

        $items = [];
        foreach (\array_slice($avisList, 0, self::LIMIT) as $avis) {
            if (!$avis instanceof Avis) {
                continue;
            }
            $user = $avis->getUser();
            $livre = $avis->getLivre();
            $items[] = [
                'type' => 'review',
                'at' => $avis->getDatePublication()->format(\DateTimeInterface::ATOM),
                'user' => $user ? $this->normalizer->userPublic($user) : null,
                'avis' => $this->normalizer->avis($avis),
                'livre' => $livre ? $this->normalizer->livre($livre) : null,
            ];
        }

        $hasMore = \count($avisList) > self::LIMIT;
        $nextCursor = [] !== $items && $hasMore ? $items[\count($items) - 1]['at'] : null;

        return [
            'items' => $items,
            'meta' => ['hasMore' => $hasMore, 'nextCursor' => $nextCursor],
        ];
    }

    private function parseCursor(?string $cursor): ?\DateTimeImmutable
    {
        if (null === $cursor || '' === $cursor) {
            return null;
        }
        try {
            return new \DateTimeImmutable($cursor);
        } catch (\Exception) {
            return null;
        }
    }
}
