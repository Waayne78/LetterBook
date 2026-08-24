<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\User;
use App\Entity\UserFollow;
use App\Enum\NotificationType;
use App\Repository\UserFollowRepository;
use App\Repository\UserRepository;
use App\Service\ApiNormalizer;
use App\Service\SocialService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class SocialServiceTest extends TestCase
{
    public function testFollowThrowsWhenFollowingSelf(): void
    {
        $followRepository = $this->createStub(UserFollowRepository::class);
        $userRepository = $this->createStub(UserRepository::class);
        $entityManager = $this->createStub(EntityManagerInterface::class);
        $normalizer = new ApiNormalizer();

        $service = new SocialService($followRepository, $userRepository, $entityManager, $normalizer);

        $user = $this->makeUser(42, 'milanos');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Impossible de vous suivre vous-même.');

        $service->follow($user, $user);
    }

    public function testFollowPersistsFollowAndFollowerNotification(): void
    {
        $followRepository = $this->createMock(UserFollowRepository::class);
        $userRepository = $this->createStub(UserRepository::class);
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $normalizer = new ApiNormalizer();

        $follower = $this->makeUser(1, 'alice');
        $target = $this->makeUser(2, 'bob');

        $followRepository
            ->expects(self::once())
            ->method('findOneBetween')
            ->with($follower, $target)
            ->willReturn(null);

        $followRepository
            ->expects(self::once())
            ->method('isFollowing')
            ->with($target, $follower)
            ->willReturn(false);

        $persisted = [];
        $entityManager
            ->expects(self::exactly(2))
            ->method('persist')
            ->willReturnCallback(static function (object $entity) use (&$persisted): void {
                $persisted[] = $entity;
            });

        $entityManager->expects(self::once())->method('flush');

        $service = new SocialService($followRepository, $userRepository, $entityManager, $normalizer);
        $service->follow($follower, $target);

        self::assertCount(2, $persisted);
        self::assertInstanceOf(UserFollow::class, $persisted[0]);
        self::assertSame($follower, $persisted[0]->getFollower());
        self::assertSame($target, $persisted[0]->getFollowing());

        self::assertSame(NotificationType::NEW_FOLLOWER, $persisted[1]->getType());
        self::assertSame($target, $persisted[1]->getUser());
        $payload = $persisted[1]->getPayload();
        self::assertIsArray($payload['user'] ?? null);
        self::assertSame(1, $payload['user']['id'] ?? null);
        self::assertSame('alice', $payload['user']['pseudo'] ?? null);
    }

    public function testRelationshipReturnsFriendsWhenMutualFollow(): void
    {
        $followRepository = $this->createMock(UserFollowRepository::class);
        $userRepository = $this->createStub(UserRepository::class);
        $entityManager = $this->createStub(EntityManagerInterface::class);
        $normalizer = new ApiNormalizer();

        $viewer = $this->makeUser(5, 'viewer');
        $target = $this->makeUser(9, 'target');

        $followRepository
            ->expects(self::exactly(2))
            ->method('isFollowing')
            ->willReturnMap([
                [$viewer, $target, true],
                [$target, $viewer, true],
            ]);

        $service = new SocialService($followRepository, $userRepository, $entityManager, $normalizer);

        self::assertSame('friends', $service->relationship($viewer, $target));
    }

    private function makeUser(int $id, string $pseudo): User
    {
        $user = (new User())
            ->setPseudo($pseudo)
            ->setEmail($pseudo.'@example.test')
            ->setPassword('secret');

        $ref = new \ReflectionProperty(User::class, 'id');
        $ref->setValue($user, $id);

        return $user;
    }
}
