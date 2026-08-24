<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Service\GoogleBooksService;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

final class GoogleBooksServiceTest extends TestCase
{
    public function testSearchVolumesReturnsNotConfiguredErrorWithoutApiKey(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->expects(self::never())->method('request');

        $service = new GoogleBooksService($httpClient, '');

        $result = $service->searchVolumes('victor hugo');

        self::assertSame('not_configured', $result['error']);
        self::assertSame([], $result['items']);
    }

    public function testSearchVolumesReturnsParsedItemsAndHttpsCover(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $response = $this->createMock(ResponseInterface::class);

        $httpClient
            ->expects(self::once())
            ->method('request')
            ->with(
                'GET',
                'https://www.googleapis.com/books/v1/volumes',
                self::callback(static function (array $options): bool {
                    return isset($options['query']['q'], $options['query']['key'])
                        && 'isbn:9782070368228' === $options['query']['q'];
                })
            )
            ->willReturn($response);

        $response
            ->expects(self::once())
            ->method('toArray')
            ->with(false)
            ->willReturn([
                'totalItems' => 1,
                'items' => [
                    [
                        'id' => 'g-1',
                        'volumeInfo' => [
                            'title' => 'Les Miserables',
                            'authors' => ['Victor Hugo'],
                            'description' => 'Desc',
                            'imageLinks' => ['thumbnail' => 'http://img.example/a.jpg'],
                            'categories' => ['Classique'],
                            'industryIdentifiers' => [
                                ['type' => 'ISBN_13', 'identifier' => '9782070368228'],
                            ],
                            'pageCount' => 512,
                            'publishedDate' => '1862',
                            'publisher' => 'Gallimard',
                            'language' => 'fr',
                        ],
                    ],
                ],
            ]);

        $service = new GoogleBooksService($httpClient, 'api-key');
        $result = $service->searchVolumes('978-2-07-036822-8', -5, 100);

        self::assertNull($result['error']);
        self::assertSame(0, $result['startIndex']);
        self::assertSame(40, $result['pageSize']);
        self::assertSame('g-1', $result['items'][0]['googleVolumeId']);
        self::assertSame('https://img.example/a.jpg', $result['items'][0]['couverture']);
        self::assertSame(512, $result['items'][0]['nombrePages']);
        self::assertSame('1862', $result['items'][0]['datePublication']);
        self::assertSame('Gallimard', $result['items'][0]['editeur']);
        self::assertSame('fr', $result['items'][0]['langue']);
    }

    public function testFetchVolumeReturnsNullOnRequestFailure(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient
            ->expects(self::once())
            ->method('request')
            ->willThrowException(new \RuntimeException('network'));

        $service = new GoogleBooksService($httpClient, 'api-key');

        self::assertNull($service->fetchVolume('vol-404'));
    }
}
