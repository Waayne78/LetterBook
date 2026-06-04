<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\AvisRepository;
use App\Repository\BibliothequeRepository;
use App\Repository\UserFollowRepository;
use App\Repository\UserRepository;
use App\Service\ApiNormalizer;
use App\Service\SocialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class ProfileController extends AbstractController
{
    public function __construct(
        private readonly ApiNormalizer $normalizer,
        private readonly UserRepository $userRepository,
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly AvisRepository $avisRepository,
        private readonly UserFollowRepository $followRepository,
        private readonly SocialService $socialService,
    ) {
    }

    #[Route('/api/profiles/{id}', name: 'api_profile_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user instanceof User) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $booksRead = $this->bibliothequeRepository->count(['user' => $user]);
        $reviews = $this->avisRepository->count(['user' => $user]);

        $recentBooks = $this->bibliothequeRepository->findBy(['user' => $user], ['id' => 'DESC'], 12);
        $readingHistory = [];
        foreach ($recentBooks as $row) {
            $readingHistory[] = $this->normalizer->bibliotheque($row);
        }

        $recentAvis = $this->avisRepository->findBy(['user' => $user], ['datePublication' => 'DESC'], 10);
        $avisOut = [];
        foreach ($recentAvis as $a) {
            $avisOut[] = $this->normalizer->avis($a);
        }

        $viewer = $this->getUser();
        $viewerUser = $viewer instanceof User ? $viewer : null;

        $payload = [
            'user' => $this->normalizer->userPublic($user),
            'stats' => [
                'livresBibliotheque' => $booksRead,
                'avis' => $reviews,
            ],
            'social' => [
                'followersCount' => $this->followRepository->countFollowers($user),
                'followingCount' => $this->followRepository->countFollowing($user),
                'friendsCount' => $this->socialService->countFriends($user),
                'relationship' => 'none',
            ],
            'historiqueLecture' => $readingHistory,
            'derniersAvis' => $avisOut,
        ];

        if ($viewerUser !== null && $viewerUser->getId() !== $user->getId()) {
            $payload['social']['relationship'] = $this->socialService->relationship($viewerUser, $user);
        }

        return $this->json($payload);
    }
}
