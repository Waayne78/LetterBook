<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class RegistrationController extends AbstractController
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository,
    ) {
    }

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return $this->json(['error' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) ? trim((string) $data['email']) : '';
        $password = isset($data['password']) ? (string) $data['password'] : '';
        $pseudo = isset($data['pseudo']) ? trim((string) $data['pseudo']) : '';
        $consent = isset($data['consentementRgpd']) ? (bool) $data['consentementRgpd'] : false;

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Email invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if ($pseudo === '' || mb_strlen($pseudo) < 2) {
            return $this->json(['error' => 'Pseudo requis (2 caractères minimum).'], Response::HTTP_BAD_REQUEST);
        }

        if (mb_strlen($password) < 8) {
            return $this->json(['error' => 'Mot de passe trop court (8 caractères minimum).'], Response::HTTP_BAD_REQUEST);
        }

        if (!$consent) {
            return $this->json(['error' => 'Le consentement RGPD est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            return $this->json(['error' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setPseudo($pseudo);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $user->setConsentementRgpd(true);
        $user->setConsentementRgpdAt(new \DateTimeImmutable());
        $user->setRoles([]);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $this->json(['message' => 'Inscription réussie.', 'userId' => $user->getId()], Response::HTTP_CREATED);
    }
}
