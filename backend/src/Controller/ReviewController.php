<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Avis;
use App\Entity\AvisLike;
use App\Entity\Commentaire;
use App\Entity\Livre;
use App\Entity\User;
use App\Repository\AvisLikeRepository;
use App\Repository\AvisRepository;
use App\Repository\CommentaireRepository;
use App\Repository\LivreRepository;
use App\Service\ApiNormalizer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
final class ReviewController extends AbstractController
{
    public function __construct(
        private readonly AvisRepository $avisRepository,
        private readonly LivreRepository $livreRepository,
        private readonly CommentaireRepository $commentaireRepository,
        private readonly AvisLikeRepository $avisLikeRepository,
        private readonly ApiNormalizer $normalizer,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/reviews', name: 'api_reviews_create', methods: ['POST'])]
    public function createReview(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $livreId = isset($data['livreId']) ? (int) $data['livreId'] : 0;
        $livre = $this->livreRepository->find($livreId);
        if (!$livre instanceof Livre) {
            return $this->json(['error' => 'Livre introuvable.'], Response::HTTP_BAD_REQUEST);
        }

        $note = isset($data['note']) ? (int) $data['note'] : 0;
        if ($note < 1 || $note > 5) {
            return $this->json(['error' => 'La note doit être entre 1 et 5.'], Response::HTTP_BAD_REQUEST);
        }

        $contenu = isset($data['contenu']) ? trim((string) $data['contenu']) : '';
        if ('' === $contenu) {
            return $this->json(['error' => 'Contenu requis.'], Response::HTTP_BAD_REQUEST);
        }

        $existing = $this->avisRepository->findOneBy(['user' => $user, 'livre' => $livre]);
        if ($existing instanceof Avis) {
            return $this->json(['error' => 'Vous avez déjà publié un avis pour ce livre.', 'avisId' => $existing->getId()], Response::HTTP_CONFLICT);
        }

        $avis = new Avis();
        $avis->setUser($user);
        $avis->setLivre($livre);
        $avis->setNote($note);
        $avis->setContenu($contenu);

        $this->entityManager->persist($avis);
        $this->entityManager->flush();

        return $this->json($this->normalizer->avis($avis), Response::HTTP_CREATED);
    }

    #[Route('/api/reviews/{id}', name: 'api_reviews_update', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function updateReview(int $id, Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $avis = $this->avisRepository->find($id);
        if (!$avis instanceof Avis || $avis->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Avis introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['note'])) {
            $n = (int) $data['note'];
            if ($n < 1 || $n > 5) {
                return $this->json(['error' => 'La note doit être entre 1 et 5.'], Response::HTTP_BAD_REQUEST);
            }
            $avis->setNote($n);
        }

        if (isset($data['contenu'])) {
            $contenu = trim((string) $data['contenu']);
            if ('' === $contenu) {
                return $this->json(['error' => 'Contenu requis.'], Response::HTTP_BAD_REQUEST);
            }
            $avis->setContenu($contenu);
        }

        $this->entityManager->flush();

        return $this->json($this->normalizer->avis($avis));
    }

    #[Route('/api/reviews/{id}', name: 'api_reviews_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteReview(int $id): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $avis = $this->avisRepository->find($id);
        if (!$avis instanceof Avis || $avis->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Avis introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($avis);
        $this->entityManager->flush();

        return $this->json(['message' => 'Avis supprimé.']);
    }

    #[Route('/api/reviews/{id}/comments', name: 'api_reviews_comments_create', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function addComment(int $id, Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $avis = $this->avisRepository->find($id);
        if (!$avis instanceof Avis) {
            return $this->json(['error' => 'Avis introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $contenu = isset($data['contenu']) ? trim((string) $data['contenu']) : '';
        if ('' === $contenu) {
            return $this->json(['error' => 'Contenu requis.'], Response::HTTP_BAD_REQUEST);
        }

        if (mb_strlen($contenu) > 500) {
            return $this->json(['error' => 'Le commentaire ne peut pas dépasser 500 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        $lastComment = $this->commentaireRepository->findLastByUser((int) $user->getId());
        if ($lastComment instanceof Commentaire) {
            $elapsed = (new \DateTimeImmutable())->getTimestamp() - $lastComment->getDatePublication()->getTimestamp();
            if ($elapsed < 5) {
                return $this->json(['error' => 'Veuillez attendre quelques secondes avant de commenter à nouveau.'], Response::HTTP_TOO_MANY_REQUESTS);
            }
        }

        $c = new Commentaire();
        $c->setUser($user);
        $c->setAvis($avis);
        $c->setContenu($contenu);

        $this->entityManager->persist($c);
        $this->entityManager->flush();

        return $this->json($this->normalizer->commentaire($c), Response::HTTP_CREATED);
    }

    #[Route('/api/comments/{id}', name: 'api_comments_update', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function updateComment(int $id, Request $request): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $this->commentaireRepository->find($id);
        if (!$comment instanceof Commentaire || $comment->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Commentaire introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !isset($data['contenu'])) {
            return $this->json(['error' => 'contenu requis.'], Response::HTTP_BAD_REQUEST);
        }

        $contenu = trim((string) $data['contenu']);
        if ('' === $contenu) {
            return $this->json(['error' => 'Contenu requis.'], Response::HTTP_BAD_REQUEST);
        }
        if (mb_strlen($contenu) > 500) {
            return $this->json(['error' => 'Le commentaire ne peut pas dépasser 500 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        $comment->setContenu($contenu);
        $this->entityManager->flush();

        return $this->json($this->normalizer->commentaire($comment));
    }

    #[Route('/api/comments/{id}', name: 'api_comments_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteComment(int $id): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $this->commentaireRepository->find($id);
        if (!$comment instanceof Commentaire || $comment->getUser()?->getId() !== $user->getId()) {
            return $this->json(['error' => 'Commentaire introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($comment);
        $this->entityManager->flush();

        return $this->json(['message' => 'Commentaire supprimé.']);
    }

    #[Route('/api/reviews/{id}/like', name: 'api_reviews_like', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function toggleLike(int $id): JsonResponse
    {
        $user = $this->requireUser();
        if (null === $user) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $avis = $this->avisRepository->find($id);
        if (!$avis instanceof Avis) {
            return $this->json(['error' => 'Avis introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $existing = $this->avisLikeRepository->findOneBy(['user' => $user, 'avis' => $avis]);
        if ($existing instanceof AvisLike) {
            $this->entityManager->remove($existing);
            $this->entityManager->flush();
            $this->entityManager->refresh($avis);

            return $this->json(['liked' => false, 'likesCount' => $avis->getLikes()->count()]);
        }

        $like = new AvisLike();
        $like->setUser($user);
        $like->setAvis($avis);
        $this->entityManager->persist($like);
        $this->entityManager->flush();
        $this->entityManager->refresh($avis);

        return $this->json(['liked' => true, 'likesCount' => $avis->getLikes()->count()]);
    }

    private function requireUser(): ?User
    {
        $u = $this->getUser();

        return $u instanceof User ? $u : null;
    }
}
