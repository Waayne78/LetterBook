<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserFollowRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserFollowRepository::class)]
#[ORM\Table(name: 'user_follow')]
#[ORM\UniqueConstraint(name: 'UNIQ_FOLLOW_PAIR', columns: ['id_follower', 'id_following'])]
class UserFollow
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_follow')]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'id_follower', referencedColumnName: 'id_utilisateur', nullable: false, onDelete: 'CASCADE')]
    private ?User $follower = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'id_following', referencedColumnName: 'id_utilisateur', nullable: false, onDelete: 'CASCADE')]
    private ?User $following = null;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFollower(): ?User
    {
        return $this->follower;
    }

    public function setFollower(?User $follower): static
    {
        $this->follower = $follower;

        return $this;
    }

    public function getFollowing(): ?User
    {
        return $this->following;
    }

    public function setFollowing(?User $following): static
    {
        $this->following = $following;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
