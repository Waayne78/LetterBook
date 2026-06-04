<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

final class AdminApiTest extends ApiTestCase
{
    public function testAdminUsersRequiresAdminRole(): void
    {
        $client = static::createClient();
        $user = $this->registerUser($client, 'admin_forbidden');
        $token = $this->login($client, $user['email'], $user['password']);

        $client->request('GET', '/api/admin/users', [], [], $this->authHeaders($token));
        self::assertResponseStatusCodeSame(403);
    }

    public function testAdminCanListUsersAndSuspend(): void
    {
        $client = static::createClient();
        $admin = $this->registerUser($client, 'admin_ok');
        $target = $this->registerUser($client, 'admin_target');

        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);
        /** @var UserRepository $users */
        $users = static::getContainer()->get(UserRepository::class);
        $adminEntity = $users->find($admin['userId']);
        self::assertInstanceOf(User::class, $adminEntity);
        $adminEntity->setRoles(['ROLE_ADMIN']);
        $em->flush();

        $token = $this->login($client, $admin['email'], $admin['password']);
        $client->request('GET', '/api/admin/users', [], [], $this->authHeaders($token));
        self::assertResponseIsSuccessful();
        $list = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($list);
        self::assertIsArray($list['users'] ?? null);

        $client->request(
            'PATCH',
            '/api/admin/users/'.$target['userId'].'/suspend',
            [],
            [],
            $this->authHeaders($token),
            json_encode(['suspended' => true], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        $body = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame(true, $body['suspended'] ?? null);
    }
}

