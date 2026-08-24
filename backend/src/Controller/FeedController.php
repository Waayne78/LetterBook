<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\AvisRepository;
use App\Repository\UserFollowRepository;
use App\Service\FeedTimelineService;
use App\Service\SocialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class FeedController extends AbstractController
{
    public function __construct(
        private readonly AvisRepository $avisRepository,
        private readonly FeedTimelineService $feedTimelineService,
        private readonly UserFollowRepository $followRepository,
        private readonly SocialService $socialService,
    ) {
    }

    #[Route('/api/feed', name: 'api_feed', methods: ['GET'])]
    public function feed(Request $request): JsonResponse
    {
        $scope = $request->query->getString('scope', 'community');
        $cursor = $request->query->getString('cursor');
        $cursor = '' !== $cursor ? $cursor : null;

        $viewer = $this->getUser();
        $viewerUser = $viewer instanceof User ? $viewer : null;

        if (\in_array($scope, ['following', 'friends'], true)) {
            if (null === $viewerUser) {
                return $this->json(['error' => 'Connectez-vous pour voir ce fil.'], Response::HTTP_UNAUTHORIZED);
            }
        }

        $timeline = match ($scope) {
            'following' => $this->buildFollowingFeed($viewerUser, $cursor),
            'friends' => $this->buildFriendsFeed($viewerUser, $cursor),
            default => $this->feedTimelineService->buildCommunity($cursor),
        };

        $popularRaw = $this->avisRepository->findPopularBooks(6);

        $legacyAvis = [];
        foreach ($timeline['items'] as $item) {
            if (($item['type'] ?? '') === 'review' && isset($item['avis'])) {
                $legacyAvis[] = $item['avis'];
            }
        }

        return $this->json([
            'items' => $timeline['items'],
            'meta' => $timeline['meta'],
            'avisRecents' => $legacyAvis,
            'livresPopulaires' => $popularRaw,
        ]);
    }

    /**
     * @return array{items: list<array<string, mixed>>, meta: array{hasMore: bool, nextCursor: string|null}}
     */
    private function buildFollowingFeed(User $user, ?string $cursor): array
    {
        $ids = $this->followRepository->findFollowingIds($user);
        $selfId = $user->getId();
        if (null !== $selfId && !\in_array($selfId, $ids, true)) {
            $ids[] = $selfId;
        }

        return $this->feedTimelineService->buildForUserIds($ids, $cursor);
    }

    /**
     * @return array{items: list<array<string, mixed>>, meta: array{hasMore: bool, nextCursor: string|null}}
     */
    private function buildFriendsFeed(User $user, ?string $cursor): array
    {
        $ids = $this->socialService->findFriendIds($user);

        return $this->feedTimelineService->buildForUserIds($ids, $cursor);
    }
}
