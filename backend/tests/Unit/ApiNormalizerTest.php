<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Bibliotheque;
use App\Entity\Livre;
use App\Enum\ReadingStatus;
use App\Service\ApiNormalizer;
use PHPUnit\Framework\TestCase;

final class ApiNormalizerTest extends TestCase
{
    public function testBibliothequeKeepsStandardStatusValues(): void
    {
        $normalizer = new ApiNormalizer();
        $book = (new Livre())
            ->setTitre('Les Miserables')
            ->setAuteur('Victor Hugo');

        $entry = (new Bibliotheque())
            ->setLivre($book)
            ->setStatut(ReadingStatus::EN_COURS)
            ->setProgression(35);

        $result = $normalizer->bibliotheque($entry);

        self::assertSame('en_cours', $result['statut']);
        self::assertSame('En cours', $result['statutLabel']);
        self::assertSame(35, $result['progression']);
        self::assertIsArray($result['livre']);
        self::assertSame('Les Miserables', $result['livre']['titre']);
    }

    public function testBibliothequeReturnsTermineStatus(): void
    {
        $normalizer = new ApiNormalizer();
        $entry = (new Bibliotheque())
            ->setStatut(ReadingStatus::TERMINE);

        $result = $normalizer->bibliotheque($entry);

        self::assertSame('termine', $result['statut']);
        self::assertSame('Terminé', $result['statutLabel']);
    }
}
