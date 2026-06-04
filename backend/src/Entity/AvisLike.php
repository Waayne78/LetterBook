<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\AvisLikeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AvisLikeRepository::class)]
#[ORM\Table(name: '`like`')]
#[ORM\UniqueConstraint(name: 'UNIQ_LIKE_USER_AVIS', columns: ['id_utilisateur', 'id_avis'])]
class AvisLike
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_like')]
    private ?int $id = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $date;

    #[ORM\ManyToOne(inversedBy: 'likes')]
    #[ORM\JoinColumn(name: 'id_utilisateur', referencedColumnName: 'id_utilisateur', nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'likes')]
    #[ORM\JoinColumn(name: 'id_avis', referencedColumnName: 'id_avis', nullable: false)]
    private ?Avis $avis = null;

    public function __construct()
    {
        $this->date = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDate(): \DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(\DateTimeImmutable $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getAvis(): ?Avis
    {
        return $this->avis;
    }

    public function setAvis(?Avis $avis): static
    {
        $this->avis = $avis;

        return $this;
    }
}
