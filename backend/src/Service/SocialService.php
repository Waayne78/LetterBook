<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Notification;
use App\Entity\User;
use App\Entity\UserFollow;
use App\Enum\NotificationType;
use App\Repository\UserFollowRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

final class SocialService
{
    public function __construct(
        private readonly UserFollowRepository $followRepository,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly ApiNormalizer $normalizer,
    ) {
    }

    public function follow(User $follower, User $target): void
    {
        if ($follower->getId() === $target->getId()) {
            throw new \InvalidArgumentException('Impossible de vous suivre vous-même.');
        }
        if ($this->followRepository->findOneBetween($follower, $target) !== null) {
            return;
        }

        $follow = new UserFollow();
        $follow->setFollower($follower);
        $follow->setFollowing($target);
        $this->entityManager->persist($follow);

        $notif = new Notification();
        $notif->setUser($target);
        $notif->setType(NotificationType::NEW_FOLLOWER);
        $notif->setPayload(['user' => $this->normalizer->userPublic($follower)]);
        $this->entityManager->persist($notif);

        if ($this->followRepository->isFollowing($target, $follower)) {
            $mutualForFollower = new Notification();
            $mutualForFollower->setUser($follower);
            $mutualForFollower->setType(NotificationType::FRIEND_MUTUAL);
            $mutualForFollower->setPayload(['user' => $this->normalizer->userPublic($target)]);
            $this->entityManager->persist($mutualForFollower);

            $mutualForTarget = new Notification();
            $mutualForTarget->setUser($target);
            $mutualForTarget->setType(NotificationType::FRIEND_MUTUAL);
            $mutualForTarget->setPayload(['user' => $this->normalizer->userPublic($follower)]);
            $this->entityManager->persist($mutualForTarget);
        }

        $this->entityManager->flush();
    }

    public function unfollow(User $follower, User $target): void
    {
        $row = $this->followRepository->findOneBetween($follower, $target);
        if ($row === null) {
            return;
        }
        $this->entityManager->remove($row);
        $this->entityManager->flush();
    }

    /**
     * @return 'none'|'following'|'follower'|'friends'
     */
    public function relationship(User $viewer, User $target): string
    {
        $following = $this->followRepository->isFollowing($viewer, $target);
        $follower = $this->followRepository->isFollowing($target, $viewer);

        if ($following && $follower) {
            return 'friends';
        }
        if ($following) {
            return 'following';
        }
        if ($follower) {
            return 'follower';
        }

        return 'none';
    }

    /** @return list<int> */
    public function findFriendIds(User $user): array
    {
        return $this->followRepository->findMutualFriendIds($user);
    }

    public function countFriends(User $user): int
    {
        return $this->followRepository->countMutualFriends($user);
    }

    public function requireUser(int $id): ?User
    {
        $user = $this->userRepository->find($id);

        return $user instanceof User ? $user : null;
    }
}
