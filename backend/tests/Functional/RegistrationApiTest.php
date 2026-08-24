<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class RegistrationApiTest extends ApiTestCase
{
    public function testRegisterCreatesUser(): void
    {
        $client = static::createClient();
        $email = 'reader_test_'.uniqid('', true).'@example.com';
        $csrf = $this->fetchCsrfToken($client);

        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_CSRF_TOKEN' => $csrf,
            ],
            json_encode([
                'pseudo' => 'reader_test',
                'email' => $email,
                'password' => 'Motdepasse123!',
                'consentementRgpd' => true,
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(201);
    }

    public function testRegisterRequiresRgpdConsent(): void
    {
        $client = static::createClient();
        $email = 'reader_fail_'.uniqid('', true).'@example.com';
        $csrf = $this->fetchCsrfToken($client);

        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_CSRF_TOKEN' => $csrf,
            ],
            json_encode([
                'pseudo' => 'reader_fail',
                'email' => $email,
                'password' => 'Motdepasse123!',
                'consentementRgpd' => false,
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(400);
    }
}
