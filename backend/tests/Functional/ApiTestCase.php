<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Livre;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ApiTestCase extends WebTestCase
{
    /** @return array{userId: int, email: string, password: string, pseudo: string} */
    protected function registerUser(KernelBrowser $client, string $suffix): array
    {
        $email = "test_{$suffix}_".uniqid('', true).'@example.com';
        $password = 'Motdepasse123!';
        $pseudo = 'user_'.$suffix.'_'.substr(uniqid('', true), -6);

        $client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'pseudo' => $pseudo,
                'email' => $email,
                'password' => $password,
                'consentementRgpd' => true,
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(201);
        $body = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($body);

        return [
            'userId' => (int) ($body['userId'] ?? 0),
            'email' => $email,
            'password' => $password,
            'pseudo' => $pseudo,
        ];
    }

    protected function login(KernelBrowser $client, string $email, string $password): string
    {
        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => $email, 'password' => $password], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertIsArray($data);
        self::assertArrayHasKey('token', $data);

        return (string) $data['token'];
    }

    /** @return array<string, string> */
    protected function authHeaders(string $token): array
    {
        return [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ];
    }

    protected function createLivre(string $suffix): Livre
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $livre = new Livre();
        $livre->setTitre('Livre test '.$suffix);
        $livre->setAuteur('Auteur test');
        $livre->setIsbn('978'.substr(str_replace('.', '', uniqid('', true)), 0, 10));
        $em->persist($livre);
        $em->flush();

        return $livre;
    }
}
