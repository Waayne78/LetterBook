<?php

declare(strict_types=1);

namespace App\Service;

use App\Util\IsbnHelper;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class GoogleBooksService
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $googleBooksApiKey,
    ) {
    }

    public function isConfigured(): bool
    {
        return '' !== $this->googleBooksApiKey;
    }

    /**
     * @return array{
     *     items: list<array<string, mixed>>,
     *     totalItems: int,
     *     startIndex: int,
     *     pageSize: int,
     *     error: string|null
     * }
     */
    public function searchVolumes(string $query, int $startIndex = 0, int $maxResults = 20): array
    {
        $query = trim($query);
        $startIndex = max(0, $startIndex);
        $maxResults = min(40, max(1, $maxResults));

        $empty = [
            'items' => [],
            'totalItems' => 0,
            'startIndex' => $startIndex,
            'pageSize' => $maxResults,
            'error' => null,
        ];

        if ('' === $query) {
            return $empty;
        }

        if (!$this->isConfigured()) {
            return [
                ...$empty,
                'error' => 'not_configured',
            ];
        }

        $googleQ = IsbnHelper::googleQuery($query);

        try {
            $response = $this->httpClient->request('GET', 'https://www.googleapis.com/books/v1/volumes', [
                'query' => [
                    'q' => $googleQ,
                    'key' => $this->googleBooksApiKey,
                    'maxResults' => $maxResults,
                    'startIndex' => $startIndex,
                ],
                'timeout' => 5,
            ]);

            $data = $response->toArray(false);
        } catch (\Throwable) {
            return [
                ...$empty,
                'error' => 'request_failed',
            ];
        }

        $totalItems = isset($data['totalItems']) && is_numeric($data['totalItems'])
            ? (int) $data['totalItems']
            : 0;

        $items = $data['items'] ?? [];
        if (!\is_array($items)) {
            return [
                ...$empty,
                'totalItems' => $totalItems,
            ];
        }

        $out = [];
        foreach ($items as $item) {
            if (!\is_array($item)) {
                continue;
            }
            $parsed = $this->parseVolumeItem($item);
            if (null !== $parsed) {
                $out[] = $parsed;
            }
        }

        return [
            'items' => $out,
            'totalItems' => $totalItems,
            'startIndex' => $startIndex,
            'pageSize' => $maxResults,
            'error' => null,
        ];
    }

    /** @return array<string, mixed>|null */
    public function parseFetchedVolume(array $item): ?array
    {
        return $this->parseVolumeItem($item);
    }

    /** @return array<string, mixed>|null */
    private function parseVolumeItem(array $item): ?array
    {
        $volumeInfo = $item['volumeInfo'] ?? [];
        if (!\is_array($volumeInfo)) {
            return null;
        }

        $imageLinks = $volumeInfo['imageLinks'] ?? [];
        $thumb = null;
        if (\is_array($imageLinks)) {
            $thumb = $imageLinks['thumbnail'] ?? $imageLinks['smallThumbnail'] ?? null;
        }

        $authors = $volumeInfo['authors'] ?? [];
        $auteur = \is_array($authors) ? implode(', ', $authors) : '';

        $isbn = null;
        $industry = $volumeInfo['industryIdentifiers'] ?? [];
        if (\is_array($industry)) {
            foreach ($industry as $iden) {
                if (!\is_array($iden)) {
                    continue;
                }
                $type = $iden['type'] ?? '';
                if ('ISBN_13' === $type || 'ISBN_10' === $type) {
                    $isbn = isset($iden['identifier']) ? (string) $iden['identifier'] : null;
                    break;
                }
            }
        }

        $categories = $volumeInfo['categories'] ?? [];
        $genre = \is_array($categories) && isset($categories[0]) ? (string) $categories[0] : null;

        $volumeId = isset($item['id']) ? (string) $item['id'] : '';
        if ('' === $volumeId) {
            return null;
        }

        return [
            'googleVolumeId' => $volumeId,
            'titre' => isset($volumeInfo['title']) ? (string) $volumeInfo['title'] : '',
            'auteur' => $auteur,
            'resume' => isset($volumeInfo['description']) ? (string) $volumeInfo['description'] : null,
            'couverture' => \is_string($thumb) ? str_replace('http://', 'https://', $thumb) : null,
            'genre' => $genre,
            'isbn' => $isbn,
            'nombrePages' => $this->extractPageCount($volumeInfo),
            'datePublication' => isset($volumeInfo['publishedDate']) ? (string) $volumeInfo['publishedDate'] : null,
            'editeur' => isset($volumeInfo['publisher']) ? (string) $volumeInfo['publisher'] : null,
            'langue' => isset($volumeInfo['language']) ? (string) $volumeInfo['language'] : null,
        ];
    }

    /** @param array<string, mixed> $volumeInfo */
    private function extractPageCount(array $volumeInfo): ?int
    {
        if (!isset($volumeInfo['pageCount']) || !is_numeric($volumeInfo['pageCount'])) {
            return null;
        }

        $pages = (int) $volumeInfo['pageCount'];

        return $pages > 0 ? $pages : null;
    }

    /** @return array<string, mixed>|null */
    public function fetchVolume(string $volumeId): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = $this->httpClient->request('GET', 'https://www.googleapis.com/books/v1/volumes/'.$volumeId, [
                'query' => ['key' => $this->googleBooksApiKey],
                'timeout' => 5,
            ]);

            return $response->toArray(false);
        } catch (\Throwable) {
            return null;
        }
    }
}
