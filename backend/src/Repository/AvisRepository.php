<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Avis;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Avis>
 */
class AvisRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Avis::class);
    }

    /** @return list<Avis> */
    public function findRecent(int $limit = 20, ?\DateTimeImmutable $before = null): array
    {
        $qb = $this->createQueryBuilder('a')
            ->orderBy('a.datePublication', 'DESC')
            ->setMaxResults($limit);

        if ($before !== null) {
            $qb->andWhere('a.datePublication < :before')->setParameter('before', $before);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @param list<int> $userIds
     *
     * @return list<Avis>
     */
    public function findRecentForUserIds(array $userIds, int $limit = 40, ?\DateTimeImmutable $before = null): array
    {
        if ($userIds === []) {
            return [];
        }

        $qb = $this->createQueryBuilder('a')
            ->andWhere('a.user IN (:users)')
            ->setParameter('users', $userIds)
            ->orderBy('a.datePublication', 'DESC')
            ->setMaxResults($limit);

        if ($before !== null) {
            $qb->andWhere('a.datePublication < :before')->setParameter('before', $before);
        }

        return $qb->getQuery()->getResult();
    }

    /** @return list<array{livreId: int, titre: string, cnt: int|string, couverture: string|null}> */
    public function findPopularBooks(int $limit = 5): array
    {
        return $this->createQueryBuilder('a')
            ->select('l.id AS livreId', 'l.titre AS titre', 'l.couverture AS couverture', 'COUNT(a.id) AS cnt')
            ->join('a.livre', 'l')
            ->groupBy('l.id')
            ->orderBy('cnt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
