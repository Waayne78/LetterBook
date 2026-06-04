<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
final class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationRepository $notificationRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/me/notifications', name: 'api_me_notifications', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->requireUser();
        if ($user === null) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $items = [];
        foreach ($this->notificationRepository->findRecentForUser($user, 40) as $n) {
            if (!$n instanceof Notification) {
                continue;
            }
            $items[] = [
                'id' => $n->getId(),
                'type' => $n->getType()->value,
                'payload' => $n->getPayload(),
                'readAt' => $n->getReadAt()?->format(\DateTimeInterface::ATOM),
                'createdAt' => $n->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return $this->json([
            'items' => $items,
            'unreadCount' => $this->notificationRepository->countUnread($user),
        ]);
    }

    #[Route('/api/me/notifications/{id}/read', name: 'api_me_notifications_read', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function markRead(int $id): JsonResponse
    {
        $user = $this->requireUser();
        if ($user === null) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $notif = $this->notificationRepository->find($id);
        if (!$notif instanceof Notification || $notif->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Notification introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $notif->setReadAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $this->json(['ok' => true]);
    }

    #[Route('/api/me/notifications/read-all', name: 'api_me_notifications_read_all', methods: ['POST'])]
    public function markAllRead(): JsonResponse
    {
        $user = $this->requireUser();
        if ($user === null) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $now = new \DateTimeImmutable();
        foreach ($this->notificationRepository->findRecentForUser($user, 200) as $n) {
            if ($n instanceof Notification && $n->getReadAt() === null) {
                $n->setReadAt($now);
            }
        }
        $this->entityManager->flush();

        return $this->json(['ok' => true]);
    }

    private function requireUser(): ?User
    {
        $u = $this->getUser();

        return $u instanceof User ? $u : null;
    }
}
