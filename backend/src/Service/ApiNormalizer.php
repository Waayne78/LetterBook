<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Avis;
use App\Entity\Bibliotheque;
use App\Entity\Commentaire;
use App\Entity\Livre;
use App\Entity\User;

final class ApiNormalizer
{
    /** @return array<string, mixed> */
    public function userPublic(User $user): array
    {
        return [
            'id' => $user->getId(),
            'pseudo' => $user->getPseudo(),
            'photo' => $user->getPhoto(),
            'bio' => $user->getBio(),
            'dateCreation' => $user->getDateCreation()->format(\DateTimeInterface::ATOM),
        ];
    }

    /** @return array<string, mixed> */
    public function userMe(User $user): array
    {
        return [
            ...$this->userPublic($user),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'consentementRgpd' => $user->isConsentementRgpd(),
        ];
    }

    /** @return array<string, mixed> */
    public function livre(Livre $livre): array
    {
        return [
            'id' => $livre->getId(),
            'titre' => $livre->getTitre(),
            'auteur' => $livre->getAuteur(),
            'resume' => $livre->getResume(),
            'couverture' => $livre->getCouverture(),
            'genre' => $livre->getGenre(),
            'isbn' => $livre->getIsbn(),
            'externalId' => $livre->getExternalId(),
        ];
    }

    /** @return array<string, mixed> */
    public function avis(Avis $avis, bool $withComments = false, ?User $viewer = null): array
    {
        $user = $avis->getUser();
        $livre = $avis->getLivre();
        $base = [
            'id' => $avis->getId(),
            'contenu' => $avis->getContenu(),
            'note' => $avis->getNote(),
            'datePublication' => $avis->getDatePublication()->format(\DateTimeInterface::ATOM),
            'livreId' => $livre?->getId(),
            'livre' => $livre ? $this->livre($livre) : null,
            'user' => $user ? $this->userPublic($user) : null,
            'likesCount' => $avis->getLikes()->count(),
            'commentsCount' => $avis->getCommentaires()->count(),
        ];

        if ($viewer !== null) {
            $liked = false;
            foreach ($avis->getLikes() as $like) {
                if ($like->getUser()?->getId() === $viewer->getId()) {
                    $liked = true;
                    break;
                }
            }
            $base['likedByMe'] = $liked;
        }

        if ($withComments) {
            $comments = [];
            foreach ($avis->getCommentaires() as $c) {
                $comments[] = $this->commentaire($c);
            }
            $base['commentaires'] = $comments;
        }

        return $base;
    }

    /** @return array<string, mixed> */
    public function commentaire(Commentaire $commentaire): array
    {
        $user = $commentaire->getUser();

        return [
            'id' => $commentaire->getId(),
            'contenu' => $commentaire->getContenu(),
            'datePublication' => $commentaire->getDatePublication()->format(\DateTimeInterface::ATOM),
            'user' => $user ? $this->userPublic($user) : null,
            'avisId' => $commentaire->getAvis()?->getId(),
        ];
    }

    /** @return array<string, mixed> */
    public function bibliotheque(Bibliotheque $b): array
    {
        $livre = $b->getLivre();

        return [
            'id' => $b->getId(),
            'statut' => $b->getStatut()->value,
            'statutLabel' => $b->getStatut()->label(),
            'progression' => $b->getProgression(),
            'livre' => $livre ? $this->livre($livre) : null,
        ];
    }
}
