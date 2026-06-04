<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\AvisRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AvisRepository::class)]
#[ORM\Table(name: 'avis')]
#[ORM\Index(name: 'IDX_AVIS_DATE', columns: ['date_publication'])]
class Avis
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_avis')]
    private ?int $id = null;

    #[ORM\Column(type: 'text')]
    private string $contenu = '';

    #[ORM\Column]
    private int $note = 0;

    #[ORM\Column(name: 'date_publication', type: 'datetime_immutable')]
    private \DateTimeImmutable $datePublication;

    #[ORM\ManyToOne(inversedBy: 'avis')]
    #[ORM\JoinColumn(name: 'id_utilisateur', referencedColumnName: 'id_utilisateur', nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'avis')]
    #[ORM\JoinColumn(name: 'id_livre', referencedColumnName: 'id_livre', nullable: false)]
    private ?Livre $livre = null;

    #[ORM\OneToMany(targetEntity: Commentaire::class, mappedBy: 'avis', orphanRemoval: true)]
    private Collection $commentaires;

    #[ORM\OneToMany(targetEntity: AvisLike::class, mappedBy: 'avis', orphanRemoval: true)]
    private Collection $likes;

    public function __construct()
    {
        $this->datePublication = new \DateTimeImmutable();
        $this->commentaires = new ArrayCollection();
        $this->likes = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContenu(): string
    {
        return $this->contenu;
    }

    public function setContenu(string $contenu): static
    {
        $this->contenu = $contenu;

        return $this;
    }

    public function getNote(): int
    {
        return $this->note;
    }

    public function setNote(int $note): static
    {
        $this->note = $note;

        return $this;
    }

    public function getDatePublication(): \DateTimeImmutable
    {
        return $this->datePublication;
    }

    public function setDatePublication(\DateTimeImmutable $datePublication): static
    {
        $this->datePublication = $datePublication;

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

    /** @return Collection<int, Commentaire> */
    public function getCommentaires(): Collection
    {
        return $this->commentaires;
    }

    /** @return Collection<int, AvisLike> */
    public function getLikes(): Collection
    {
        return $this->likes;
    }
}
