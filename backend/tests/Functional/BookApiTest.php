<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class BookApiTest extends ApiTestCase
{
    public function testBookSearchIsPublic(): void
    {
        $client = static::createClient();
        $livre = $this->createLivre('search');
        $client->request('GET', '/api/books/search?q='.urlencode(substr($livre->getTitre(), 0, 8)));
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
    }

    public function testBookShow(): void
    {
        $client = static::createClient();
        $livre = $this->createLivre('show');
        $client->request('GET', '/api/books/'.$livre->getId());
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
        self::assertSame($livre->getId(), $data['livre']['id'] ?? null);
    }

    public function testVolumeNotFoundReturns404(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/books/volume/introuvable-volume');
        self::assertResponseStatusCodeSame(404);
    }
}
