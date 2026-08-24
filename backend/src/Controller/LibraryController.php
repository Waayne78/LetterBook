<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Bibliotheque;
use App\Entity\Livre;
use App\Entity\User;
use App\Enum\ReadingStatus;
use App\Repository\BibliothequeRepository;
use App\Repository\LivreRepository;
use App\Service\ApiNormalizer;
use App\Service\LivreImportService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
final class LibraryController extends AbstractController
{
    public function __construct(
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly LivreRepository $livreRepository,
        private readonly LivreImportService $livreImportService,
        private readonly ApiNormalizer $normalizer,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/library', name: 'api_library_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $statutParam = $request->query->getString('statut');
        if ('' !== $statutParam && !\in_array($statutParam, ['a_lire', 'en_cours', 'termine'], true)) {
            return $this->json(['error' => 'Statut invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $statut = match ($statutParam) {
            'a_lire' => ReadingStatus::A_LIRE,
            'en_cours' => ReadingStatus::EN_COURS,
            'termine' => ReadingStatus::TERMINE,
            default => null,
        };

        $items = $this->bibliothequeRepository->findByUserAndStatus($user, $statut);
        $out = [];
        foreach ($items as $b) {
            $out[] = $this->normalizer->bibliotheque($b);
        }

        return $this->json(['items' => $out]);
    }

    #[Route('/api/library', name: 'api_library_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $livre = null;
        if (isset($data['googleVolumeId'])) {
            try {
                $livre = $this->livreImportService->importFromGoogleVolumeId((string) $data['googleVolumeId']);
            } catch (\InvalidArgumentException $e) {
                return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        } elseif (isset($data['livreId'])) {
            $livre = $this->livreRepository->find((int) $data['livreId']);
        }

        if (!$livre instanceof Livre) {
            return $this->json(['error' => 'livreId ou googleVolumeId requis.'], Response::HTTP_BAD_REQUEST);
        }

        $existing = $this->bibliothequeRepository->findOneBy(['user' => $user, 'livre' => $livre]);
        if ($existing instanceof Bibliotheque) {
            return $this->json(['error' => 'Ce livre est déjà dans votre bibliothèque.', 'item' => $this->normalizer->bibliotheque($existing)], Response::HTTP_CONFLICT);
        }

        $statut = ReadingStatus::A_LIRE;
        if (isset($data['statut'])) {
            $statut = match ((string) $data['statut']) {
                'a_lire' => ReadingStatus::A_LIRE,
                'en_cours' => ReadingStatus::EN_COURS,
                'termine' => ReadingStatus::TERMINE,
                default => ReadingStatus::A_LIRE,
            };
        }

        $progression = isset($data['progression']) ? (int) $data['progression'] : null;
        if (null !== $progression) {
            $progression = max(0, min(100, $progression));
        }

        $entry = new Bibliotheque();
        $entry->setUser($user);
        $entry->setLivre($livre);
        $entry->setStatut($statut);
        $entry->setProgression($progression);

        $this->entityManager->persist($entry);
        $this->entityManager->flush();

        return $this->json($this->normalizer->bibliotheque($entry), Response::HTTP_CREATED);
    }

    #[Route('/api/library/{id}', name: 'api_library_update', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $entry = $this->bibliothequeRepository->find($id);
        if (!$entry instanceof Bibliotheque || $entry->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Entrée introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['statut'])) {
            $st = match ((string) $data['statut']) {
                'a_lire' => ReadingStatus::A_LIRE,
                'en_cours' => ReadingStatus::EN_COURS,
                'termine' => ReadingStatus::TERMINE,
                default => null,
            };
            if (null !== $st) {
                $entry->setStatut($st);
            }
        }

        if (\array_key_exists('progression', $data)) {
            $p = $data['progression'];
            $entry->setProgression(null === $p ? null : max(0, min(100, (int) $p)));
        }

        $entry->touchUpdatedAt();
        $this->entityManager->flush();

        return $this->json($this->normalizer->bibliotheque($entry));
    }

    #[Route('/api/library/{id}', name: 'api_library_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $entry = $this->bibliothequeRepository->find($id);
        if (!$entry instanceof Bibliotheque || $entry->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Entrée introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($entry);
        $this->entityManager->flush();

        return $this->json(['message' => 'Retiré de la bibliothèque.']);
    }

    private function requireUser(): ?User
    {
        $u = $this->getUser();

        return $u instanceof User ? $u : null;
    }
}
