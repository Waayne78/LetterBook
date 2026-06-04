<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\ReadingStatus;
use App\Repository\BibliothequeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BibliothequeRepository::class)]
#[ORM\Table(name: 'bibliotheque')]
#[ORM\UniqueConstraint(name: 'UNIQ_BIB_USER_LIVRE', columns: ['id_utilisateur', 'id_livre'])]
class Bibliotheque
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_bibliotheque')]
    private ?int $id = null;

    #[ORM\Column(length: 32, enumType: ReadingStatus::class)]
    private ReadingStatus $statut = ReadingStatus::A_LIRE;

    #[ORM\Column(nullable: true)]
    private ?int $progression = null;

    #[ORM\ManyToOne(inversedBy: 'bibliothequeItems')]
    #[ORM\JoinColumn(name: 'id_utilisateur', referencedColumnName: 'id_utilisateur', nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'bibliothequeItems')]
    #[ORM\JoinColumn(name: 'id_livre', referencedColumnName: 'id_livre', nullable: false)]
    private ?Livre $livre = null;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function touchUpdatedAt(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStatut(): ReadingStatus
    {
        return $this->statut;
    }

    public function setStatut(ReadingStatus $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getProgression(): ?int
    {
        return $this->progression;
    }

    public function setProgression(?int $progression): static
    {
        $this->progression = $progression;

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

    public function getLivre(): ?Livre
    {
        return $this->livre;
    }

    public function setLivre(?Livre $livre): static
    {
        $this->livre = $livre;

        return $this;
    }
}
