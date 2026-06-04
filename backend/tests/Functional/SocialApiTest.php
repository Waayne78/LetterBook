<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class SocialApiTest extends ApiTestCase
{
    public function testFeedCommunityIsPublic(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/feed?scope=community');
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
        self::assertArrayHasKey('items', $data);
        self::assertArrayHasKey('livresPopulaires', $data);
    }

    public function testFeedFollowingRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/feed?scope=following');
        self::assertResponseStatusCodeSame(401);
    }

    public function testFollowMutualBecomesFriends(): void
    {
        $client = static::createClient();
        $userA = $this->registerUser($client, 'a');
        $userB = $this->registerUser($client, 'b');
        $tokenA = $this->login($client, $userA['email'], $userA['password']);

        $client->request('POST', '/api/users/'.$userB['userId'].'/follow', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame('following', $data['relationship'] ?? null);

        $tokenB = $this->login($client, $userB['email'], $userB['password']);
        $client->request('POST', '/api/users/'.$userA['userId'].'/follow', [], [], $this->authHeaders($tokenB));
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame('friends', $data['relationship'] ?? null);
    }

    public function testMeSocialLists(): void
    {
        $client = static::createClient();
        $userA = $this->registerUser($client, 'social_a');
        $userB = $this->registerUser($client, 'social_b');
        $tokenA = $this->login($client, $userA['email'], $userA['password']);

        $client->request('POST', '/api/users/'.$userB['userId'].'/follow', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/me/social', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
        self::assertArrayHasKey('following', $data);
        self::assertArrayHasKey('counts', $data);
        self::assertSame(1, $data['counts']['following'] ?? 0);
    }

    public function testFeedFriendsScopeWithAuth(): void
    {
        $client = static::createClient();
        $userA = $this->registerUser($client, 'feed_a');
        $userB = $this->registerUser($client, 'feed_b');
        $tokenA = $this->login($client, $userA['email'], $userA['password']);
        $tokenB = $this->login($client, $userB['email'], $userB['password']);

        $client->request('POST', '/api/users/'.$userB['userId'].'/follow', [], [], $this->authHeaders($tokenA));
        $client->request('POST', '/api/users/'.$userA['userId'].'/follow', [], [], $this->authHeaders($tokenB));

        $client->request('GET', '/api/feed?scope=friends', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();
    }

    public function testSearchUsersAndUnfollow(): void
    {
        $client = static::createClient();
        $userA = $this->registerUser($client, 'search_a');
        $userB = $this->registerUser($client, 'search_b');
        $tokenA = $this->login($client, $userA['email'], $userA['password']);

        $client->request('POST', '/api/users/'.$userB['userId'].'/follow', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/users/search?q=user_search', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
        self::assertIsArray($data['users'] ?? null);

        $client->request('DELETE', '/api/users/'.$userB['userId'].'/follow', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();
        $unfollowed = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame('none', $unfollowed['relationship'] ?? null);
    }
}
