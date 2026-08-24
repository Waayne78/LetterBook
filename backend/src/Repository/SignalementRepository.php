<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Signalement;
use App\Enum\ReportStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Signalement>
 */
class SignalementRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Signalement::class);
    }

    /** @return list<Signalement> */
    public function findByStatus(?ReportStatus $status, int $limit = 200): array
    {
        $qb = $this->createQueryBuilder('s')
            ->orderBy('s.createdAt', 'DESC')
            ->setMaxResults($limit);

        if (null !== $status) {
            $qb->andWhere('s.status = :status')
                ->setParameter('status', $status);
        }

        /* @var list<Signalement> */
        return $qb->getQuery()->getResult();
    }
}
