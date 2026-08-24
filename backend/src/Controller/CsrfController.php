<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class CsrfController extends AbstractController
{
    #[Route('/api/csrf', name: 'api_csrf', methods: ['GET'])]
    public function token(CsrfTokenManagerInterface $csrfTokenManager): JsonResponse
    {
        return $this->json([
            'csrfToken' => $csrfTokenManager->getToken('api')->getValue(),
        ]);
    }
}
