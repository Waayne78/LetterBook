<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class FeedApiTest extends WebTestCase
{
    public function testFeedIsPublicAndReturnsJson(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/feed');

        self::assertResponseIsSuccessful();
        self::assertJson($client->getResponse()->getContent());
    }
}
