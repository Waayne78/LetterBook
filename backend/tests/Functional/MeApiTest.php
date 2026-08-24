<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class MeApiTest extends ApiTestCase
{
    public function testMeEndpointsRequireAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/me');
        self::assertResponseStatusCodeSame(401);
    }

    public function testGetAndPatchMe(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'me_patch');
        $token = $this->login($client, $user['email'], $user['password']);

        $client->request('GET', '/api/me', [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
        $me = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame($user['email'], $me['email'] ?? null);

        $client->request(
            'PATCH',
            '/api/me',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['pseudo' => 'Milane', 'bio' => 'Bio de test'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        $updated = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame('Milane', $updated['pseudo'] ?? null);
        self::assertSame('Bio de test', $updated['bio'] ?? null);
    }
}
