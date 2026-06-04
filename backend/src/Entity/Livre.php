<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\LivreRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LivreRepository::class)]
#[ORM\Table(name: 'livre')]
#[ORM\Index(name: 'IDX_LIVRE_TITRE', columns: ['titre'])]
#[ORM\Index(name: 'IDX_LIVRE_AUTEUR', columns: ['auteur'])]
class Livre
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_livre')]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $titre = '';

    #[ORM\Column(length: 255)]
    private string $auteur = '';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $resume = null;

    #[ORM\Column(length: 512, nullable: true)]
    private ?string $couverture = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $genre = null;

    #[ORM\Column(length: 32, nullable: true, unique: true)]
    private ?string $isbn = null;

    #[ORM\Column(length: 64, nullable: true, unique: true)]
    private ?string $externalId = null;

    #[ORM\OneToMany(targetEntity: Avis::class, mappedBy: 'livre', orphanRemoval: true)]
    private Collection $avis;

    #[ORM\OneToMany(targetEntity: Bibliotheque::class, mappedBy: 'livre', orphanRemoval: true)]
    private Collection $bibliothequeItems;

    public function __construct()
    {
        $this->avis = new ArrayCollection();
        $this->bibliothequeItems = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitre(): string
    {
        return $this->titre;
    }

    public function setTitre(string $titre): static
    {
        $this->titre = $titre;

        return $this;
    }

    public function getAuteur(): string
    {
        return $this->auteur;
    }

    public function setAuteur(string $auteur): static
    {
        $this->auteur = $auteur;

        return $this;
    }

    public function getResume(): ?string
    {
        return $this->resume;
    }

    public function setResume(?string $resume): static
    {
        $this->resume = $resume;

        return $this;
    }

    public function getCouverture(): ?string
    {
        return $this->couverture;
    }

    public function setCouverture(?string $couverture): static
    {
        $this->couverture = $couverture;

        return $this;
    }

    public function getGenre(): ?string
    {
        return $this->genre;
    }

    public function setGenre(?string $genre): static
    {
        $this->genre = $genre;

        return $this;
    }

    public function getIsbn(): ?string
    {
        return $this->isbn;
    }

    public function setIsbn(?string $isbn): static
    {
        $this->isbn = $isbn;

        return $this;
    }

    public function getExternalId(): ?string
    {
        return $this->externalId;
    }

    public function setExternalId(?string $externalId): static
    {
        $this->externalId = $externalId;

        return $this;
    }

    /** @return Collection<int, Avis> */
    public function getAvis(): Collection
    {
        return $this->avis;
    }

    /** @return Collection<int, Bibliotheque> */
    public function getBibliothequeItems(): Collection
    {
        return $this->bibliothequeItems;
    }
}
