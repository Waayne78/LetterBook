<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Event\RefreshEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class JwtAuthenticationSuccessSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            'lexik_jwt_authentication.on_authentication_success' => 'onAuthenticationSuccess',
            'gesdinet.refresh_token' => 'onRefreshToken',
        ];
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $this->touchLastLogin($user);
    }

    public function onRefreshToken(RefreshEvent $event): void
    {
        $user = $event->getToken()->getUser();
        if (!$user instanceof UserInterface) {
            return;
        }

        if (!$user instanceof User) {
            $managed = $this->entityManager->getRepository(User::class)->findOneBy([
                'email' => $user->getUserIdentifier(),
            ]);
            if (!$managed instanceof User) {
                return;
            }
            $user = $managed;
        }

        $this->touchLastLogin($user);
    }

    private function touchLastLogin(User $user): void
    {
        $user->setLastLoginAt(new \DateTimeImmutable());
        $this->entityManager->flush();
    }
}
