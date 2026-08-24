<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use App\Entity\UserFollow;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserFollow>
 */
class UserFollowRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserFollow::class);
    }

    public function findOneBetween(User $follower, User $following): ?UserFollow
    {
        $row = $this->findOneBy(['follower' => $follower, 'following' => $following]);

        return $row instanceof UserFollow ? $row : null;
    }

    public function isFollowing(User $follower, User $following): bool
    {
        return null !== $this->findOneBetween($follower, $following);
    }

    /** @return list<int> */
    public function findFollowingIds(User $user): array
    {
        $rows = $this->createQueryBuilder('f')
            ->select('IDENTITY(f.following) AS uid')
            ->andWhere('f.follower = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();

        return array_map(static fn (array $r) => (int) $r['uid'], $rows);
    }

    /** @return list<int> */
    public function findFollowerIds(User $user): array
    {
        $rows = $this->createQueryBuilder('f')
            ->select('IDENTITY(f.follower) AS uid')
            ->andWhere('f.following = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();

        return array_map(static fn (array $r) => (int) $r['uid'], $rows);
    }

    public function countFollowers(User $user): int
    {
        return (int) $this->count(['following' => $user]);
    }

    public function countFollowing(User $user): int
    {
        return (int) $this->count(['follower' => $user]);
    }

    public function isMutualFollow(User $a, User $b): bool
    {
        return $this->isFollowing($a, $b) && $this->isFollowing($b, $a);
    }

    /** @return list<int> */
    public function findMutualFriendIds(User $user): array
    {
        $following = $this->findFollowingIds($user);
        $followers = $this->findFollowerIds($user);

        return array_values(array_intersect($following, $followers));
    }

    public function countMutualFriends(User $user): int
    {
        return \count($this->findMutualFriendIds($user));
    }
}
