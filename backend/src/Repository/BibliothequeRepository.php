<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Bibliotheque;
use App\Entity\Livre;
use App\Entity\User;
use App\Enum\ReadingStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Bibliotheque>
 */
class BibliothequeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Bibliotheque::class);
    }

    /** @return list<Bibliotheque> */
    public function findByUserAndStatus(User $user, ?ReadingStatus $statut): array
    {
        $qb = $this->createQueryBuilder('b')
            ->andWhere('b.user = :user')
            ->setParameter('user', $user)
            ->orderBy('b.id', 'ASC');

        if (null !== $statut) {
            $qb->andWhere('b.statut = :statut')->setParameter('statut', $statut);
        }

        return $qb->getQuery()->getResult();
    }

    public function findOneByUserAndLivre(User $user, Livre $livre): ?Bibliotheque
    {
        $entry = $this->findOneBy(['user' => $user, 'livre' => $livre]);

        return $entry instanceof Bibliotheque ? $entry : null;
    }

    /**
     * @param list<int> $userIds
     *
     * @return list<Bibliotheque>
     */
    public function findRecentActivityForUserIds(array $userIds, int $limit = 40, ?\DateTimeImmutable $before = null): array
    {
        if ([] === $userIds) {
            return [];
        }

        $qb = $this->createQueryBuilder('b')
            ->andWhere('b.user IN (:users)')
            ->setParameter('users', $userIds)
            ->orderBy('b.updatedAt', 'DESC')
            ->setMaxResults($limit);

        if (null !== $before) {
            $qb->andWhere('b.updatedAt < :before')->setParameter('before', $before);
        }

        return $qb->getQuery()->getResult();
    }
}
