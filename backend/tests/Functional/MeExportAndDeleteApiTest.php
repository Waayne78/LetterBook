<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Avis;
use App\Repository\AvisRepository;
use App\Repository\UserRepository;

final class MeExportAndDeleteApiTest extends ApiTestCase
{
    public function testExportAndDeleteAnonymizesReviews(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'export_delete');
        $token = $this->login($client, $user['email'], $user['password']);
        $livre = $this->createLivre('export_delete');

        $client->request(
            'POST',
            '/api/reviews',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['livreId' => $livre->getId(), 'note' => 5, 'contenu' => 'Avis à anonymiser'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        $avis = json_decode($client->getResponse()->getContent() ?: '', true);
        $avisId = (int) ($avis['id'] ?? 0);

        $client->request('GET', '/api/me/export', [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
        $export = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame($user['email'], $export['profile']['email'] ?? null);
        self::assertCount(1, $export['avis'] ?? []);
        self::assertArrayHasKey('notifications', $export);
        self::assertArrayHasKey('signalements', $export);
        self::assertArrayHasKey('refreshTokens', $export);

        $client->request(
            'DELETE',
            '/api/me',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['password' => $user['password']], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        /** @var UserRepository $users */
        $users = static::getContainer()->get(UserRepository::class);
        self::assertNull($users->find($user['userId']));

        /** @var AvisRepository $avisRepo */
        $avisRepo = static::getContainer()->get(AvisRepository::class);
        $savedAvis = $avisRepo->find($avisId);
        self::assertInstanceOf(Avis::class, $savedAvis);
        self::assertNull($savedAvis->getUser());
    }
}
