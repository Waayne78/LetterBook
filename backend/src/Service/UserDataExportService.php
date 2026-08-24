<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\AvisRepository;
use App\Repository\BibliothequeRepository;
use App\Repository\CommentaireRepository;
use App\Repository\NotificationRepository;
use App\Repository\SignalementRepository;
use App\Repository\UserFollowRepository;
use Doctrine\ORM\EntityManagerInterface;

final class UserDataExportService
{
    public function __construct(
        private readonly ApiNormalizer $normalizer,
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly AvisRepository $avisRepository,
        private readonly CommentaireRepository $commentaireRepository,
        private readonly UserFollowRepository $userFollowRepository,
        private readonly NotificationRepository $notificationRepository,
        private readonly SignalementRepository $signalementRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /** @return array<string, mixed> */
    public function export(User $user): array
    {
        $library = [];
        foreach ($this->bibliothequeRepository->findByUserAndStatus($user, null) as $entry) {
            $library[] = $this->normalizer->bibliotheque($entry);
        }

        $avis = [];
        foreach ($this->avisRepository->findBy(['user' => $user]) as $review) {
            $avis[] = $this->normalizer->avis($review);
        }

        $comments = [];
        foreach ($this->commentaireRepository->findBy(['user' => $user]) as $comment) {
            $comments[] = $this->normalizer->commentaire($comment);
        }

        $notifications = [];
        foreach ($this->notificationRepository->findRecentForUser($user, 200) as $notification) {
            $notifications[] = [
                'id' => $notification->getId(),
                'type' => $notification->getType()->value,
                'payload' => $notification->getPayload(),
                'readAt' => $notification->getReadAt()?->format(\DateTimeInterface::ATOM),
                'createdAt' => $notification->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        $reports = [];
        foreach ($this->signalementRepository->findBy(['reporter' => $user], ['createdAt' => 'DESC'], 200) as $report) {
            $reports[] = [
                'id' => $report->getId(),
                'targetType' => $report->getTargetType()->value,
                'targetId' => $report->getTargetId(),
                'motif' => $report->getMotif(),
                'status' => $report->getStatus()->value,
                'createdAt' => $report->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'resolvedAt' => $report->getResolvedAt()?->format(\DateTimeInterface::ATOM),
            ];
        }

        $refreshTokens = [];
        foreach ($this->entityManager->getRepository(RefreshToken::class)->findBy(['username' => $user->getUserIdentifier()]) as $token) {
            $refreshTokens[] = [
                'id' => $token->getId(),
                'validUntil' => $token->getValid()?->format(\DateTimeInterface::ATOM),
            ];
        }

        return [
            'exportedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'profile' => $this->normalizer->userMe($user),
            'bibliotheque' => $library,
            'avis' => $avis,
            'commentaires' => $comments,
            'notifications' => $notifications,
            'signalements' => $reports,
            'refreshTokens' => $refreshTokens,
            'social' => [
                'followingIds' => $this->userFollowRepository->findFollowingIds($user),
                'followerIds' => $this->userFollowRepository->findFollowerIds($user),
                'friendIds' => $this->userFollowRepository->findMutualFriendIds($user),
            ],
        ];
    }
}
