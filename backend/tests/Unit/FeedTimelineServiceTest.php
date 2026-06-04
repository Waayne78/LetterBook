<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Avis;
use App\Entity\Bibliotheque;
use App\Entity\Livre;
use App\Entity\User;
use App\Enum\ReadingStatus;
use App\Repository\AvisRepository;
use App\Repository\BibliothequeRepository;
use App\Service\ApiNormalizer;
use App\Service\FeedTimelineService;
use PHPUnit\Framework\TestCase;

final class FeedTimelineServiceTest extends TestCase
{
    public function testBuildForUserIdsSortsAndBuildsExpectedEventTypes(): void
    {
        $avisRepository = $this->createMock(AvisRepository::class);
        $bibliothequeRepository = $this->createMock(BibliothequeRepository::class);
        $service = new FeedTimelineService($avisRepository, $bibliothequeRepository, new ApiNormalizer());

        $user = $this->makeUser(1, 'milanos');
        $book = (new Livre())->setTitre('Les Miserables')->setAuteur('Victor Hugo');

        $review = (new Avis())
            ->setUser($user)
            ->setLivre($book)
            ->setContenu('Superbe')
            ->setNote(5)
            ->setDatePublication(new \DateTimeImmutable('2026-06-02T10:00:00+00:00'));

        $added = (new Bibliotheque())
            ->setUser($user)
            ->setLivre($book)
            ->setStatut(ReadingStatus::A_LIRE)
            ->setProgression(null);
        $this->setDateProperty($added, 'createdAt', new \DateTimeImmutable('2026-06-02T10:30:00+00:00'));
        $this->setDateProperty($added, 'updatedAt', new \DateTimeImmutable('2026-06-02T10:30:01+00:00'));

        $updated = (new Bibliotheque())
            ->setUser($user)
            ->setLivre($book)
            ->setStatut(ReadingStatus::EN_COURS)
            ->setProgression(25);
        $this->setDateProperty($updated, 'createdAt', new \DateTimeImmutable('2026-06-02T09:00:00+00:00'));
        $this->setDateProperty($updated, 'updatedAt', new \DateTimeImmutable('2026-06-02T11:00:00+00:00'));

        $avisRepository
            ->expects(self::once())
            ->method('findRecentForUserIds')
            ->willReturn([$review, 'invalid']);

        $bibliothequeRepository
            ->expects(self::once())
            ->method('findRecentActivityForUserIds')
            ->willReturn([$added, $updated, 'invalid']);

        $result = $service->buildForUserIds([1], 'invalid-cursor');

        self::assertFalse($result['meta']['hasMore']);
        self::assertCount(3, $result['items']);
        self::assertSame('library_status', $result['items'][0]['type']);
        self::assertSame('library_add', $result['items'][1]['type']);
        self::assertSame('review', $result['items'][2]['type']);
        self::assertSame('en_cours', $result['items'][0]['statut']);
    }

    public function testBuildCommunitySetsPaginationCursor(): void
    {
        $avisRepository = $this->createMock(AvisRepository::class);
        $bibliothequeRepository = $this->createStub(BibliothequeRepository::class);
        $service = new FeedTimelineService($avisRepository, $bibliothequeRepository, new ApiNormalizer());

        $user = $this->makeUser(2, 'reader');
        $book = (new Livre())->setTitre('Book')->setAuteur('Author');
        $reviews = [];

        for ($i = 0; $i < 31; ++$i) {
            $reviews[] = (new Avis())
                ->setUser($user)
                ->setLivre($book)
                ->setContenu('Avis '.$i)
                ->setNote(4)
                ->setDatePublication(new \DateTimeImmutable(sprintf('2026-06-02T%02d:00:00+00:00', $i % 24)));
        }

        $avisRepository
            ->expects(self::once())
            ->method('findRecent')
            ->willReturn($reviews);

        $result = $service->buildCommunity('not-a-date');

        self::assertTrue($result['meta']['hasMore']);
        self::assertCount(30, $result['items']);
        self::assertNotNull($result['meta']['nextCursor']);
    }

    private function makeUser(int $id, string $pseudo): User
    {
        $user = (new User())
            ->setPseudo($pseudo)
            ->setEmail($pseudo.'@example.test')
            ->setPassword('secret');

        $ref = new \ReflectionProperty(User::class, 'id');
        $ref->setValue($user, $id);

        return $user;
    }

    private function setDateProperty(Bibliotheque $entry, string $property, \DateTimeImmutable $value): void
    {
        $ref = new \ReflectionProperty(Bibliotheque::class, $property);
        $ref->setValue($entry, $value);
    }
}

