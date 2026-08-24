<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Avis;
use App\Entity\Commentaire;
use App\Entity\Signalement;
use App\Entity\User;
use App\Enum\ReportStatus;
use App\Enum\ReportTargetType;
use App\Repository\AvisRepository;
use App\Repository\CommentaireRepository;
use App\Repository\SignalementRepository;
use App\Repository\UserRepository;
use App\Service\ReportService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
final class AdminController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly AvisRepository $avisRepository,
        private readonly CommentaireRepository $commentaireRepository,
        private readonly SignalementRepository $signalementRepository,
        private readonly ReportService $reportService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/admin/users', name: 'api_admin_users', methods: ['GET'])]
    public function users(): JsonResponse
    {
        $users = $this->userRepository->findBy([], ['id' => 'ASC'], 200);
        $out = [];
        foreach ($users as $u) {
            if (!$u instanceof User) {
                continue;
            }
            $out[] = [
                'id' => $u->getId(),
                'pseudo' => $u->getPseudo(),
                'email' => $u->getEmail(),
                'roles' => $u->getRoles(),
                'suspended' => $u->isSuspended(),
                'dateCreation' => $u->getDateCreation()->format(\DateTimeInterface::ATOM),
            ];
        }

        return $this->json(['users' => $out]);
    }

    #[Route('/api/admin/users/{id}/suspend', name: 'api_admin_suspend', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function suspend(int $id, Request $request): JsonResponse
    {
        $admin = $this->requireUser();
        if (null === $admin) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->userRepository->find($id);
        if (!$user instanceof User) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !\array_key_exists('suspended', $data)) {
            return $this->json(['error' => 'Champ suspended requis.'], Response::HTTP_BAD_REQUEST);
        }

        $suspended = (bool) $data['suspended'];
        if ($suspended) {
            if ($admin->getId() === $user->getId()) {
                return $this->json(['error' => 'Vous ne pouvez pas suspendre votre propre compte.'], Response::HTTP_BAD_REQUEST);
            }
            if (\in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                return $this->json(['error' => 'Impossible de suspendre un administrateur.'], Response::HTTP_BAD_REQUEST);
            }
        }

        $user->setSuspended($suspended);
        $this->entityManager->flush();

        return $this->json(['message' => 'Mis à jour.', 'userId' => $user->getId(), 'suspended' => $user->isSuspended()]);
    }

    #[Route('/api/admin/reports', name: 'api_admin_reports', methods: ['GET'])]
    public function reports(Request $request): JsonResponse
    {
        $statusParam = $request->query->get('status');
        $status = null;
        if (\is_string($statusParam) && '' !== $statusParam) {
            $status = ReportStatus::tryFrom($statusParam);
            if (!$status instanceof ReportStatus) {
                return $this->json(['error' => 'Statut invalide.'], Response::HTTP_BAD_REQUEST);
            }
        }

        $reports = $this->signalementRepository->findByStatus($status);
        $out = [];
        foreach ($reports as $report) {
            $out[] = $this->reportService->normalizeForAdmin($report);
        }

        return $this->json(['reports' => $out]);
    }

    #[Route('/api/admin/reports/{id}', name: 'api_admin_reports_patch', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function updateReport(int $id, Request $request): JsonResponse
    {
        $admin = $this->requireUser();
        if (null === $admin) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $report = $this->signalementRepository->find($id);
        if (!$report instanceof Signalement) {
            return $this->json(['error' => 'Signalement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !isset($data['status'])) {
            return $this->json(['error' => 'Champ status requis.'], Response::HTTP_BAD_REQUEST);
        }

        $status = ReportStatus::tryFrom((string) $data['status']);
        if (!$status instanceof ReportStatus || ReportStatus::PENDING === $status) {
            return $this->json(['error' => 'Statut invalide (resolved ou dismissed attendu).'], Response::HTTP_BAD_REQUEST);
        }

        $report->setStatus($status);
        $report->setResolvedAt(new \DateTimeImmutable());
        $report->setResolvedBy($admin);
        $this->entityManager->flush();

        return $this->json($this->reportService->normalizeForAdmin($report));
    }

    #[Route('/api/admin/avis/{id}', name: 'api_admin_avis_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteAvis(int $id): JsonResponse
    {
        $admin = $this->requireUser();
        if (null === $admin) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $avis = $this->avisRepository->find($id);
        if (!$avis instanceof Avis) {
            return $this->json(['error' => 'Avis introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->reportService->resolvePendingForTarget(ReportTargetType::AVIS, $id, $admin);
        $this->entityManager->remove($avis);
        $this->entityManager->flush();

        return $this->json(['message' => 'Avis modéré et supprimé.']);
    }

    #[Route('/api/admin/comments/{id}', name: 'api_admin_comments_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteComment(int $id): JsonResponse
    {
        $admin = $this->requireUser();
        if (null === $admin) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $this->commentaireRepository->find($id);
        if (!$comment instanceof Commentaire) {
            return $this->json(['error' => 'Commentaire introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->reportService->resolvePendingForTarget(ReportTargetType::COMMENTAIRE, $id, $admin);
        $this->entityManager->remove($comment);
        $this->entityManager->flush();

        return $this->json(['message' => 'Commentaire modéré et supprimé.']);
    }

    private function requireUser(): ?User
    {
        $u = $this->getUser();

        return $u instanceof User ? $u : null;
    }
}
