<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Avis;
use App\Entity\User;
use App\Repository\AvisRepository;
use App\Repository\UserRepository;
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
        $user = $this->userRepository->find($id);
        if (!$user instanceof User) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !\array_key_exists('suspended', $data)) {
            return $this->json(['error' => 'Champ suspended requis.'], Response::HTTP_BAD_REQUEST);
        }

        $user->setSuspended((bool) $data['suspended']);
        $this->entityManager->flush();

        return $this->json(['message' => 'Mis à jour.', 'userId' => $user->getId(), 'suspended' => $user->isSuspended()]);
    }

    #[Route('/api/admin/avis/{id}', name: 'api_admin_avis_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteAvis(int $id): JsonResponse
    {
        $avis = $this->avisRepository->find($id);
        if (!$avis instanceof Avis) {
            return $this->json(['error' => 'Avis introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($avis);
        $this->entityManager->flush();

        return $this->json(['message' => 'Avis modéré et supprimé.']);
    }
}
