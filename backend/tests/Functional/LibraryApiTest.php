<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class LibraryApiTest extends ApiTestCase
{
    public function testLibraryRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/library');
        self::assertResponseStatusCodeSame(401);
    }

    public function testLibraryInvalidStatutReturns400(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'lib_statut');
        $token = $this->login($client, $user['email'], $user['password']);

        $client->request('GET', '/api/library?statut=invalide', [], [], $this->authHeaders($token));
        self::assertResponseStatusCodeSame(400);
    }

    public function testLibraryCrud(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'lib_crud');
        $token = $this->login($client, $user['email'], $user['password']);
        $livre = $this->createLivre('lib');

        $client->request(
            'POST',
            '/api/library',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['livreId' => $livre->getId(), 'statut' => 'a_lire'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        $created = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($created);
        $entryId = (int) ($created['id'] ?? 0);
        self::assertGreaterThan(0, $entryId);

        $client->request('GET', '/api/library', [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
        $list = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertCount(1, $list['items'] ?? []);

        $client->request(
            'PATCH',
            '/api/library/'.$entryId,
            [],
            [],
            $this->authHeaders($token),
            json_encode(['statut' => 'en_cours', 'progression' => 50], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        $updated = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame('en_cours', $updated['statut'] ?? null);

        $client->request('DELETE', '/api/library/'.$entryId, [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
    }

    public function testDuplicateEntryReturnsConflict(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'lib_duplicate');
        $token = $this->login($client, $user['email'], $user['password']);
        $livre = $this->createLivre('lib_dup');

        $payload = json_encode(['livreId' => $livre->getId(), 'statut' => 'a_lire'], JSON_THROW_ON_ERROR);
        $client->request('POST', '/api/library', [], [], $this->authHeaders($token), $payload);
        self::assertResponseStatusCodeSame(201);

        $client->request('POST', '/api/library', [], [], $this->authHeaders($token), $payload);
        self::assertResponseStatusCodeSame(409);
    }
}
