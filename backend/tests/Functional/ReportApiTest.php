<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

final class ReportApiTest extends ApiTestCase
{
    public function testReportReviewAndComment(): void
    {
        $client = static::createClient();
        $author = $this->registerUser($client, 'report_author');
        $reporter = $this->registerUser($client, 'report_reporter');
        $authorToken = $this->login($client, $author['email'], $author['password']);
        $reporterToken = $this->login($client, $reporter['email'], $reporter['password']);
        $livre = $this->createLivre('report');

        $client->request(
            'POST',
            '/api/reviews',
            [],
            [],
            $this->authHeaders($authorToken),
            json_encode([
                'livreId' => $livre->getId(),
                'note' => 3,
                'contenu' => 'Contenu signalable.',
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        $avis = json_decode($client->getResponse()->getContent() ?: '', true);
        $avisId = (int) ($avis['id'] ?? 0);

        $client->request(
            'POST',
            '/api/reviews/'.$avisId.'/report',
            [],
            [],
            $this->authHeaders($reporterToken),
            json_encode(['motif' => 'Contenu inapproprié'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/reviews/'.$avisId.'/report',
            [],
            [],
            $this->authHeaders($reporterToken),
            json_encode(['motif' => 'Doublon'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        $duplicate = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertSame(false, $duplicate['created'] ?? null);

        $client->request(
            'POST',
            '/api/reviews/'.$avisId.'/comments',
            [],
            [],
            $this->authHeaders($authorToken),
            json_encode(['contenu' => 'Commentaire signalable'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        $comment = json_decode($client->getResponse()->getContent() ?: '', true);
        $commentId = (int) ($comment['id'] ?? 0);

        $client->request(
            'POST',
            '/api/comments/'.$commentId.'/report',
            [],
            [],
            $this->authHeaders($reporterToken),
            json_encode(['motif' => 'Spam'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
    }

    public function testAdminCanListAndResolveReports(): void
    {
        $client = static::createClient();
        $admin = $this->registerUser($client, 'report_admin');
        $author = $this->registerUser($client, 'report_admin_author');
        $reporter = $this->registerUser($client, 'report_admin_reporter');

        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);
        /** @var UserRepository $users */
        $users = static::getContainer()->get(UserRepository::class);
        $adminEntity = $users->find($admin['userId']);
        self::assertInstanceOf(User::class, $adminEntity);
        $adminEntity->setRoles(['ROLE_ADMIN']);
        $em->flush();

        $authorToken = $this->login($client, $author['email'], $author['password']);
        $reporterToken = $this->login($client, $reporter['email'], $reporter['password']);
        $adminToken = $this->login($client, $admin['email'], $admin['password']);
        $livre = $this->createLivre('report_admin');

        $client->request(
            'POST',
            '/api/reviews',
            [],
            [],
            $this->authHeaders($authorToken),
            json_encode(['livreId' => $livre->getId(), 'note' => 2, 'contenu' => 'Modération test'], JSON_THROW_ON_ERROR),
        );
        $avis = json_decode($client->getResponse()->getContent() ?: '', true);
        $avisId = (int) ($avis['id'] ?? 0);

        $client->request(
            'POST',
            '/api/reviews/'.$avisId.'/report',
            [],
            [],
            $this->authHeaders($reporterToken),
            json_encode(['motif' => 'Test admin'], JSON_THROW_ON_ERROR),
        );

        $client->request('GET', '/api/admin/reports?status=pending', [], [], $this->authHeaders($adminToken));
        self::assertResponseIsSuccessful();
        $list = json_decode($client->getResponse()->getContent() ?: '', true);
        self::assertNotEmpty($list['reports'] ?? []);
        $reportId = (int) $list['reports'][0]['id'];

        $client->request(
            'PATCH',
            '/api/admin/reports/'.$reportId,
            [],
            [],
            $this->authHeaders($adminToken),
            json_encode(['status' => 'resolved'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request('DELETE', '/api/admin/avis/'.$avisId, [], [], $this->authHeaders($adminToken));
        self::assertResponseIsSuccessful();
    }
}
