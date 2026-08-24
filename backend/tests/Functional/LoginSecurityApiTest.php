<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class LoginSecurityApiTest extends ApiTestCase
{
    public function testLoginRateLimitAfterFiveAttempts(): void
    {
        $client = static::createClient();
        $client->setServerParameter('REMOTE_ADDR', '203.0.113.99');
        $user = $this->registerUser($client, 'rate_limit');

        for ($i = 0; $i < 5; ++$i) {
            $csrf = $this->fetchCsrfToken($client);
            $client->request(
                'POST',
                '/api/login',
                [],
                [],
                [
                    'CONTENT_TYPE' => 'application/json',
                    'HTTP_X_CSRF_TOKEN' => $csrf,
                ],
                json_encode(['email' => $user['email'], 'password' => 'wrong-password'], JSON_THROW_ON_ERROR),
            );
        }

        $csrf = $this->fetchCsrfToken($client);
        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_CSRF_TOKEN' => $csrf,
            ],
            json_encode(['email' => $user['email'], 'password' => 'wrong-password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(429);
    }

    public function testRegisterRequiresCsrf(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'pseudo' => 'noccsrf',
                'email' => 'noccsrf@example.com',
                'password' => 'Motdepasse123!',
                'consentementRgpd' => true,
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(403);
    }
}
