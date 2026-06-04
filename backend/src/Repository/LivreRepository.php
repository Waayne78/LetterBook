<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Livre;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Livre>
 */
class LivreRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Livre::class);
    }

    /** @return list<Livre> */
    public function findRelatedByGenre(?string $genre, int $excludeId, int $limit = 4): array
    {
        if ($genre === null || trim($genre) === '') {
            return [];
        }

        return $this->createQueryBuilder('l')
            ->andWhere('l.genre = :genre')
            ->andWhere('l.id != :excludeId')
            ->setParameter('genre', $genre)
            ->setParameter('excludeId', $excludeId)
            ->orderBy('l.id', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
