<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Enum\ReportTargetType;
use App\Service\ReportService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
final class ReportController extends AbstractController
{
    public function __construct(
        private readonly ReportService $reportService,
    ) {
    }

    #[Route('/api/reviews/{id}/report', name: 'api_reviews_report', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function reportReview(int $id, Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $motif = $this->extractMotif($request);

        try {
            $result = $this->reportService->report($user, ReportTargetType::AVIS, $id, $motif);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'message' => $result['created'] ? 'Signalement enregistré.' : 'Vous avez déjà signalé ce contenu.',
            'reportId' => $result['signalement']->getId(),
            'created' => $result['created'],
        ], $result['created'] ? Response::HTTP_CREATED : Response::HTTP_OK);
    }

    #[Route('/api/comments/{id}/report', name: 'api_comments_report', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function reportComment(int $id, Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $motif = $this->extractMotif($request);

        try {
            $result = $this->reportService->report($user, ReportTargetType::COMMENTAIRE, $id, $motif);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'message' => $result['created'] ? 'Signalement enregistré.' : 'Vous avez déjà signalé ce contenu.',
            'reportId' => $result['signalement']->getId(),
            'created' => $result['created'],
        ], $result['created'] ? Response::HTTP_CREATED : Response::HTTP_OK);
    }

    private function extractMotif(Request $request): ?string
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !isset($data['motif'])) {
            return null;
        }

        return (string) $data['motif'];
    }

    private function requireUser(): ?User
    {
        $u = $this->getUser();

        return $u instanceof User ? $u : null;
    }
}
