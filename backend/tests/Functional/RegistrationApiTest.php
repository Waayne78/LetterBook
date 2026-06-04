<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class RegistrationApiTest extends WebTestCase
{
    public function testRegisterCreatesUser(): void
    {
        $client = static::createClient();

        $email = 'reader_test_'.uniqid('', true).'@example.com';

        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
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

        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
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
