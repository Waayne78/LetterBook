<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class ProfileApiTest extends ApiTestCase
{
    public function testProfileIsPublic(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'profile_pub');
        $client->request('GET', '/api/profiles/'.$user['userId']);
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
        self::assertArrayHasKey('user', $data);
        self::assertArrayHasKey('social', $data);
        self::assertArrayHasKey('followersCount', $data['social']);
        self::assertArrayHasKey('followingCount', $data['social']);
    }

    public function testProfileRelationshipForViewer(): void
    {
        $client = static::createClient();
        $userA = $this->registerUser($client, 'profile_a');
        $userB = $this->registerUser($client, 'profile_b');
        $tokenA = $this->login($client, $userA['email'], $userA['password']);

        $client->request('POST', '/api/users/'.$userB['userId'].'/follow', [], [], $this->authHeaders($tokenA));

        $client->request('GET', '/api/profiles/'.$userB['userId'], [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame('following', $data['social']['relationship'] ?? null);
    }
}
