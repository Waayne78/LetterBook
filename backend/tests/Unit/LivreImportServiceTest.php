<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Livre;
use App\Repository\LivreRepository;
use App\Service\GoogleBooksService;
use App\Service\LivreImportService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class LivreImportServiceTest extends TestCase
{
    public function testReturnsExistingBookWithoutCallingGoogle(): void
    {
        $repository = $this->createMock(LivreRepository::class);
        $httpClient = $this->createMock(\Symfony\Contracts\HttpClient\HttpClientInterface::class);
        $google = new GoogleBooksService($httpClient, 'api-key');
        $entityManager = $this->createMock(EntityManagerInterface::class);

        $existing = (new Livre())->setTitre('Existing')->setAuteur('Author');

        $repository
            ->expects(self::once())
            ->method('findOneBy')
            ->with(['externalId' => 'vol-1'])
            ->willReturn($existing);

        $httpClient->expects(self::never())->method('request');
        $entityManager->expects(self::never())->method('persist');
        $entityManager->expects(self::never())->method('flush');

        $service = new LivreImportService($repository, $google, $entityManager);

        self::assertSame($existing, $service->importFromGoogleVolumeId('vol-1'));
    }

    public function testThrowsWhenGoogleReturnsNull(): void
    {
        $repository = $this->createMock(LivreRepository::class);
        $httpClient = $this->createMock(\Symfony\Contracts\HttpClient\HttpClientInterface::class);
        $google = new GoogleBooksService($httpClient, 'api-key');
        $entityManager = $this->createStub(EntityManagerInterface::class);

        $repository
            ->expects(self::once())
            ->method('findOneBy')
            ->with(['externalId' => 'missing'])
            ->willReturn(null);
        $httpClient
            ->expects(self::once())
            ->method('request')
            ->willThrowException(new \RuntimeException('network'));

        $service = new LivreImportService($repository, $google, $entityManager);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Impossible de récupérer ce volume.');

        $service->importFromGoogleVolumeId('missing');
    }

    public function testImportsAndMapsGoogleVolumeIntoLivre(): void
    {
        $repository = $this->createMock(LivreRepository::class);
        $httpClient = $this->createMock(\Symfony\Contracts\HttpClient\HttpClientInterface::class);
        $response = $this->createMock(\Symfony\Contracts\HttpClient\ResponseInterface::class);
        $google = new GoogleBooksService($httpClient, 'api-key');
        $entityManager = $this->createMock(EntityManagerInterface::class);

        $repository
            ->expects(self::once())
            ->method('findOneBy')
            ->with(['externalId' => 'vol-42'])
            ->willReturn(null);
        $httpClient
            ->expects(self::once())
            ->method('request')
            ->willReturn($response);
        $response
            ->expects(self::once())
            ->method('toArray')
            ->with(false)
            ->willReturn([
                'id' => 'vol-42',
                'volumeInfo' => [
                    'title' => 'Les Miserables',
                    'authors' => ['Victor Hugo'],
                    'description' => 'Classic novel',
                    'imageLinks' => ['thumbnail' => 'http://img.example/cover.jpg'],
                    'categories' => ['Roman'],
                    'industryIdentifiers' => [
                        ['type' => 'ISBN_13', 'identifier' => '9782070409181'],
                    ],
                    'pageCount' => 1232,
                    'publishedDate' => '1862-01',
                    'publisher' => 'Librairie',
                    'language' => 'fr',
                ],
            ]);

        $persisted = null;
        $entityManager
            ->expects(self::once())
            ->method('persist')
            ->willReturnCallback(static function (object $entity) use (&$persisted): void {
                $persisted = $entity;
            });
        $entityManager->expects(self::once())->method('flush');

        $service = new LivreImportService($repository, $google, $entityManager);
        $result = $service->importFromGoogleVolumeId('vol-42');

        self::assertInstanceOf(Livre::class, $result);
        self::assertSame($persisted, $result);
        self::assertSame('vol-42', $result->getExternalId());
        self::assertSame('Les Miserables', $result->getTitre());
        self::assertSame('Victor Hugo', $result->getAuteur());
        self::assertSame('Classic novel', $result->getResume());
        self::assertSame('https://img.example/cover.jpg', $result->getCouverture());
        self::assertSame('Roman', $result->getGenre());
        self::assertSame('9782070409181', $result->getIsbn());
        self::assertSame(1232, $result->getNombrePages());
        self::assertSame('1862-01', $result->getDatePublication());
        self::assertSame('Librairie', $result->getEditeur());
        self::assertSame('fr', $result->getLangue());
    }
}

