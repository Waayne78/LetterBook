<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /** @return list<User> */
    public function searchByPseudo(string $q, int $limit = 20): array
    {
        $q = trim($q);
        if (mb_strlen($q) < 2) {
            return [];
        }

        return $this->createQueryBuilder('u')
            ->andWhere('LOWER(u.pseudo) LIKE :q')
            ->andWhere('u.suspended = false')
            ->setParameter('q', '%'.mb_strtolower($q).'%')
            ->orderBy('u.pseudo', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /** @return list<User> */
    public function findRecentActive(int $limit = 12): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.suspended = false')
            ->orderBy('u.dateCreation', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
