<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class NotificationApiTest extends ApiTestCase
{
    public function testListAndMarkNotificationsAsRead(): void
    {
        $client = static::createClient();
        $userA = $this->registerUser($client, 'notif_a');
        $userB = $this->registerUser($client, 'notif_b');

        $tokenA = $this->login($client, $userA['email'], $userA['password']);
        $client->request('POST', '/api/users/'.$userB['userId'].'/follow', [], [], $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();

        $tokenB = $this->login($client, $userB['email'], $userB['password']);
        $client->request('GET', '/api/me/notifications', [], [], $this->authHeaders($tokenB));
        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
        self::assertGreaterThanOrEqual(1, (int) ($data['unreadCount'] ?? 0));
        self::assertIsArray($data['items'] ?? null);
        $notifId = (int) ($data['items'][0]['id'] ?? 0);
        self::assertGreaterThan(0, $notifId);

        $client->request('PATCH', '/api/me/notifications/'.$notifId.'/read', [], [], $this->authHeaders($tokenB));
        self::assertResponseIsSuccessful();

        $client->request('POST', '/api/me/notifications/read-all', [], [], $this->authHeaders($tokenB));
        self::assertResponseIsSuccessful();
    }
}
