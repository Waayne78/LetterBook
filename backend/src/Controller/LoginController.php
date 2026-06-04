<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Route matérielle pour POST /api/login : l'authentification est traitée par le firewall json_login.
 */
final class LoginController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): Response
    {
        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
