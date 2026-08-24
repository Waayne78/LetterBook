<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class ReviewApiTest extends ApiTestCase
{
    public function testCreateReviewAndLike(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'review');
        $token = $this->login($client, $user['email'], $user['password']);
        $livre = $this->createLivre('review');

        $client->request(
            'POST',
            '/api/reviews',
            [],
            [],
            $this->authHeaders($token),
            json_encode([
                'livreId' => $livre->getId(),
                'note' => 4,
                'contenu' => 'Très bon livre de test.',
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        $avis = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($avis);
        $avisId = (int) ($avis['id'] ?? 0);
        self::assertGreaterThan(0, $avisId);

        $client->request('POST', '/api/reviews/'.$avisId.'/like', [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
        $liked = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame(true, $liked['liked'] ?? null);

        $client->request('POST', '/api/reviews/'.$avisId.'/like', [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
        $unliked = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame(false, $unliked['liked'] ?? null);

        $client->request(
            'PATCH',
            '/api/reviews/'.$avisId,
            [],
            [],
            $this->authHeaders($token),
            json_encode(['note' => 5, 'contenu' => 'Mise à jour'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        $updated = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame(5, $updated['note'] ?? null);

        $client->request(
            'PATCH',
            '/api/reviews/'.$avisId,
            [],
            [],
            $this->authHeaders($token),
            json_encode(['contenu' => '   '], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(400);

        $client->request('DELETE', '/api/reviews/'.$avisId, [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
    }

    public function testReviewRequiresAuth(): void
    {
        $client = static::createClient();
        $livre = $this->createLivre('review_guest');
        $client->request(
            'POST',
            '/api/reviews',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['livreId' => $livre->getId(), 'note' => 3, 'contenu' => 'Test'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(401);
    }

    public function testCommentMaxLengthAndAntiSpam(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'comment_rules');
        $token = $this->login($client, $user['email'], $user['password']);
        $livre = $this->createLivre('comment_rules');

        $client->request(
            'POST',
            '/api/reviews',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['livreId' => $livre->getId(), 'note' => 4, 'contenu' => 'Avis test'], JSON_THROW_ON_ERROR),
        );
        $avis = json_decode($client->getResponse()->getContent() ?: '', true);
        $avisId = (int) ($avis['id'] ?? 0);

        $client->request(
            'POST',
            '/api/reviews/'.$avisId.'/comments',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['contenu' => str_repeat('a', 501)], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(400);

        $client->request(
            'POST',
            '/api/reviews/'.$avisId.'/comments',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['contenu' => 'Premier commentaire'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/reviews/'.$avisId.'/comments',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['contenu' => 'Deuxième trop vite'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(429);
    }
}
