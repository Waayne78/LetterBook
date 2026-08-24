<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Service\AccountDeletionService;
use App\Service\ApiNormalizer;
use App\Service\UserDataExportService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
final class MeController extends AbstractController
{
    public function __construct(
        private readonly ApiNormalizer $normalizer,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly AccountDeletionService $accountDeletionService,
        private readonly UserDataExportService $userDataExportService,
    ) {
    }

    #[Route('/api/me', name: 'api_me_get', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->normalizer->userMe($user));
    }

    #[Route('/api/me', name: 'api_me_patch', methods: ['PATCH'])]
    public function update(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['pseudo'])) {
            $pseudo = trim((string) $data['pseudo']);
            if ('' !== $pseudo && mb_strlen($pseudo) >= 2) {
                $user->setPseudo($pseudo);
            }
        }

        if (\array_key_exists('bio', $data)) {
            $user->setBio(null !== $data['bio'] ? (string) $data['bio'] : null);
        }

        if (\array_key_exists('photo', $data)) {
            $user->setPhoto(null !== $data['photo'] ? (string) $data['photo'] : null);
        }

        if (isset($data['password'])) {
            $password = (string) $data['password'];
            if (mb_strlen($password) < 8) {
                return $this->json(['error' => 'Le nouveau mot de passe doit contenir au moins 8 caractères.'], Response::HTTP_BAD_REQUEST);
            }

            $currentPassword = isset($data['currentPassword']) ? (string) $data['currentPassword'] : '';
            if ('' === $currentPassword || !$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
                return $this->json(['error' => 'Mot de passe actuel incorrect.'], Response::HTTP_BAD_REQUEST);
            }

            $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        }

        $this->entityManager->flush();

        return $this->json($this->normalizer->userMe($user));
    }

    #[Route('/api/me/photo', name: 'api_me_photo_upload', methods: ['POST'])]
    public function uploadPhoto(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $file = $request->files->get('photo');
        if (!$file instanceof UploadedFile) {
            return $this->json(['error' => 'Fichier photo requis.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$file->isValid()) {
            return $this->json(['error' => 'Upload invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if (null !== $file->getSize() && $file->getSize() > 2 * 1024 * 1024) {
            return $this->json(['error' => 'Image trop volumineuse (max 2 Mo).'], Response::HTTP_BAD_REQUEST);
        }

        $mimeType = $file->getClientMimeType();
        $allowedMimeToExtension = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];

        if (!isset($allowedMimeToExtension[$mimeType])) {
            return $this->json(['error' => 'Format non supporté (jpeg, png, webp, gif).'], Response::HTTP_BAD_REQUEST);
        }

        $projectDir = (string) $this->getParameter('kernel.project_dir');
        $relativeDir = '/uploads/avatars';
        $targetDir = $projectDir.'/public'.$relativeDir;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0775, true);
        }

        $extension = $allowedMimeToExtension[$mimeType];
        $filename = bin2hex(random_bytes(16)).'.'.$extension;

        $oldPhoto = $user->getPhoto();
        $file->move($targetDir, $filename);
        $user->setPhoto($relativeDir.'/'.$filename);
        $this->entityManager->flush();

        if (\is_string($oldPhoto) && str_starts_with($oldPhoto, $relativeDir.'/')) {
            $oldPath = $projectDir.'/public'.$oldPhoto;
            if (is_file($oldPath)) {
                @unlink($oldPath);
            }
        }

        return $this->json(['photo' => $user->getPhoto()]);
    }

    #[Route('/api/me/export', name: 'api_me_export', methods: ['GET'])]
    public function export(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->userDataExportService->export($user));
    }

    #[Route('/api/me', name: 'api_me_delete', methods: ['DELETE'])]
    public function delete(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent() ?: '{}', true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $password = isset($data['password']) ? (string) $data['password'] : '';
        if ('' === $password || !$this->passwordHasher->isPasswordValid($user, $password)) {
            return $this->json(['error' => 'Mot de passe incorrect.'], Response::HTTP_BAD_REQUEST);
        }

        $this->accountDeletionService->deleteAccount($user);

        return $this->json(['message' => 'Compte supprimé. Les avis publics ont été anonymisés.']);
    }
}
