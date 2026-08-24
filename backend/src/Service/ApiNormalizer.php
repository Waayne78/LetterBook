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
    private const DELETED_USER_PSEUDO = 'Utilisateur supprimé';

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
    public function userPublicOrDeleted(?User $user): ?array
    {
        if (null === $user) {
            return [
                'id' => null,
                'pseudo' => self::DELETED_USER_PSEUDO,
                'photo' => null,
                'bio' => null,
                'dateCreation' => null,
            ];
        }

        return $this->userPublic($user);
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
            'nombrePages' => $livre->getNombrePages(),
            'datePublication' => $livre->getDatePublication(),
            'editeur' => $livre->getEditeur(),
            'langue' => $livre->getLangue(),
        ];
    }

    /**
     * @param array<string, mixed> $parsed
     *
     * @return array<string, mixed>
     */
    public function livreFromParsed(array $parsed, ?string $volumeId = null): array
    {
        return [
            'id' => null,
            'titre' => isset($parsed['titre']) && \is_string($parsed['titre']) ? $parsed['titre'] : '',
            'auteur' => isset($parsed['auteur']) && \is_string($parsed['auteur']) ? $parsed['auteur'] : '',
            'resume' => isset($parsed['resume']) && \is_string($parsed['resume']) ? $parsed['resume'] : null,
            'couverture' => isset($parsed['couverture']) && \is_string($parsed['couverture']) ? $parsed['couverture'] : null,
            'genre' => isset($parsed['genre']) && \is_string($parsed['genre']) ? $parsed['genre'] : null,
            'isbn' => isset($parsed['isbn']) && \is_string($parsed['isbn']) ? $parsed['isbn'] : null,
            'externalId' => $volumeId ?? (isset($parsed['googleVolumeId']) && \is_string($parsed['googleVolumeId']) ? $parsed['googleVolumeId'] : null),
            'nombrePages' => isset($parsed['nombrePages']) && is_numeric($parsed['nombrePages']) ? (int) $parsed['nombrePages'] : null,
            'datePublication' => isset($parsed['datePublication']) && \is_string($parsed['datePublication']) ? $parsed['datePublication'] : null,
            'editeur' => isset($parsed['editeur']) && \is_string($parsed['editeur']) ? $parsed['editeur'] : null,
            'langue' => isset($parsed['langue']) && \is_string($parsed['langue']) ? $parsed['langue'] : null,
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
            'user' => $this->userPublicOrDeleted($user),
            'likesCount' => $avis->getLikes()->count(),
            'commentsCount' => $avis->getCommentaires()->count(),
        ];

        if (null !== $viewer) {
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
            'user' => $this->userPublicOrDeleted($user),
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
