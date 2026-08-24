<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserFollowRepository;
use App\Repository\UserRepository;
use App\Service\ApiNormalizer;
use App\Service\SocialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
final class SocialController extends AbstractController
{
    public function __construct(
        private readonly SocialService $socialService,
        private readonly UserFollowRepository $followRepository,
        private readonly UserRepository $userRepository,
        private readonly ApiNormalizer $normalizer,
    ) {
    }

    #[Route('/api/me/social', name: 'api_me_social', methods: ['GET'])]
    public function meSocial(): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->buildSocialLists($user));
    }

    #[Route('/api/users/search', name: 'api_users_search', methods: ['GET'])]
    public function searchUsers(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $q = trim($request->query->getString('q'));
        $users = $this->userRepository->searchByPseudo($q, 20);
        $out = [];
        foreach ($users as $u) {
            if ($u->getId() === $user->getId()) {
                continue;
            }
            $out[] = [
                ...$this->normalizer->userPublic($u),
                'relationship' => $this->socialService->relationship($user, $u),
            ];
        }

        return $this->json(['users' => $out]);
    }

    #[Route('/api/users/suggestions', name: 'api_users_suggestions', methods: ['GET'])]
    public function suggestions(): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $users = $this->userRepository->findRecentActive(12);
        $out = [];
        foreach ($users as $u) {
            if ($u->getId() === $user->getId()) {
                continue;
            }
            $out[] = [
                ...$this->normalizer->userPublic($u),
                'relationship' => $this->socialService->relationship($user, $u),
            ];
        }

        return $this->json(['users' => $out]);
    }

    #[Route('/api/users/{id}/follow', name: 'api_users_follow', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function follow(int $id): JsonResponse
    {
        $user = $this->requireUser();
        $target = $this->socialService->requireUser($id);
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if (null === $target) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $this->socialService->follow($user, $target);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json(['relationship' => $this->socialService->relationship($user, $target)]);
    }

    #[Route('/api/users/{id}/follow', name: 'api_users_unfollow', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function unfollow(int $id): JsonResponse
    {
        $user = $this->requireUser();
        $target = $this->socialService->requireUser($id);
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if (null === $target) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->socialService->unfollow($user, $target);

        return $this->json(['relationship' => $this->socialService->relationship($user, $target)]);
    }

    /** @return array<string, mixed> */
    private function buildSocialLists(User $user): array
    {
        $following = [];
        foreach ($this->followRepository->findFollowingIds($user) as $uid) {
            $u = $this->userRepository->find($uid);
            if ($u instanceof User) {
                $following[] = $this->normalizer->userPublic($u);
            }
        }

        $followers = [];
        foreach ($this->followRepository->findFollowerIds($user) as $uid) {
            $u = $this->userRepository->find($uid);
            if ($u instanceof User) {
                $followers[] = $this->normalizer->userPublic($u);
            }
        }

        $friends = [];
        foreach ($this->socialService->findFriendIds($user) as $uid) {
            $u = $this->userRepository->find($uid);
            if ($u instanceof User) {
                $friends[] = $this->normalizer->userPublic($u);
            }
        }

        return [
            'following' => $following,
            'followers' => $followers,
            'friends' => $friends,
            'counts' => [
                'following' => $this->followRepository->countFollowing($user),
                'followers' => $this->followRepository->countFollowers($user),
                'friends' => $this->socialService->countFriends($user),
            ],
        ];
    }

    private function requireUser(): ?User
    {
        $u = $this->getUser();

        return $u instanceof User ? $u : null;
    }
}
