<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class ApiSecuritySubscriber implements EventSubscriberInterface
{
    private const CSRF_PROTECTED_PATHS = [
        '/api/register' => ['POST'],
        '/api/login' => ['POST'],
    ];

    public function __construct(
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
        private readonly RateLimiterFactory $loginLimiter,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 9],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();
        $method = $request->getMethod();

        if ('/api/login' === $path && 'POST' === $method) {
            $this->enforceLoginRateLimit($event);
            if ($event->hasResponse()) {
                return;
            }
        }

        $allowedMethods = self::CSRF_PROTECTED_PATHS[$path] ?? null;
        if (null === $allowedMethods || !\in_array($method, $allowedMethods, true)) {
            return;
        }

        $headerToken = $request->headers->get('X-CSRF-Token', '');
        if (!$this->csrfTokenManager->isTokenValid(new CsrfToken('api', (string) $headerToken))) {
            $event->setResponse(new JsonResponse(['error' => 'Jeton CSRF invalide ou manquant.'], Response::HTTP_FORBIDDEN));
        }
    }

    private function enforceLoginRateLimit(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $limiter = $this->loginLimiter->create($request->getClientIp() ?? 'unknown');
        $limit = $limiter->consume(1);

        if (!$limit->isAccepted()) {
            $event->setResponse(new JsonResponse(
                ['error' => 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS,
            ));
        }
    }
}
