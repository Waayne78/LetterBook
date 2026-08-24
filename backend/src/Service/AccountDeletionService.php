<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Avis;
use App\Entity\Commentaire;
use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\AvisRepository;
use App\Repository\CommentaireRepository;
use App\Repository\NotificationRepository;
use App\Repository\SignalementRepository;
use App\Repository\UserFollowRepository;
use Doctrine\ORM\EntityManagerInterface;

final class AccountDeletionService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly AvisRepository $avisRepository,
        private readonly CommentaireRepository $commentaireRepository,
        private readonly UserFollowRepository $userFollowRepository,
        private readonly NotificationRepository $notificationRepository,
        private readonly SignalementRepository $signalementRepository,
    ) {
    }

    public function deleteAccount(User $user): void
    {
        $userId = (int) $user->getId();
        if ($userId <= 0) {
            return;
        }

        $this->deleteUserPhotoFile($user);
        $this->deleteRefreshTokens($user);

        $avisList = $this->avisRepository->findBy(['user' => $user]);
        foreach ($avisList as $avis) {
            if ($avis instanceof Avis) {
                $avis->setUser(null);
            }
        }

        $comments = $this->commentaireRepository->findBy(['user' => $user]);
        foreach ($comments as $comment) {
            if ($comment instanceof Commentaire) {
                $comment->setUser(null);
            }
        }

        foreach ($user->getBibliothequeItems()->toArray() as $item) {
            $this->entityManager->remove($item);
        }

        foreach ($user->getLikes()->toArray() as $like) {
            $this->entityManager->remove($like);
        }

        $follows = $this->userFollowRepository->createQueryBuilder('f')
            ->andWhere('f.follower = :user OR f.following = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
        foreach ($follows as $follow) {
            $this->entityManager->remove($follow);
        }

        $notifications = $this->notificationRepository->findBy(['user' => $user]);
        foreach ($notifications as $notification) {
            $this->entityManager->remove($notification);
        }

        $reports = $this->signalementRepository->findBy(['reporter' => $user]);
        foreach ($reports as $report) {
            $this->entityManager->remove($report);
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }

    private function deleteRefreshTokens(User $user): void
    {
        $tokens = $this->entityManager->getRepository(RefreshToken::class)->findBy([
            'username' => $user->getUserIdentifier(),
        ]);
        foreach ($tokens as $token) {
            $this->entityManager->remove($token);
        }
    }

    private function deleteUserPhotoFile(User $user): void
    {
        $photo = $user->getPhoto();
        if (!\is_string($photo) || !str_starts_with($photo, '/uploads/avatars/')) {
            return;
        }

        $projectDir = \dirname(__DIR__, 2);
        $path = $projectDir.'/public'.$photo;
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
