<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Avis;
use App\Entity\Commentaire;
use App\Entity\Signalement;
use App\Entity\User;
use App\Enum\ReportStatus;
use App\Enum\ReportTargetType;
use App\Repository\AvisRepository;
use App\Repository\CommentaireRepository;
use App\Repository\SignalementRepository;
use Doctrine\ORM\EntityManagerInterface;

final class ReportService
{
    public function __construct(
        private readonly SignalementRepository $signalementRepository,
        private readonly AvisRepository $avisRepository,
        private readonly CommentaireRepository $commentaireRepository,
        private readonly ApiNormalizer $normalizer,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{signalement: Signalement, created: bool}
     */
    public function report(User $reporter, ReportTargetType $targetType, int $targetId, ?string $motif): array
    {
        $this->assertTargetExists($targetType, $targetId);

        $existing = $this->signalementRepository->findOneBy([
            'reporter' => $reporter,
            'targetType' => $targetType,
            'targetId' => $targetId,
        ]);

        if ($existing instanceof Signalement) {
            return ['signalement' => $existing, 'created' => false];
        }

        $signalement = new Signalement();
        $signalement->setReporter($reporter);
        $signalement->setTargetType($targetType);
        $signalement->setTargetId($targetId);
        $signalement->setMotif(null !== $motif && '' !== trim($motif) ? trim($motif) : null);
        $signalement->setStatus(ReportStatus::PENDING);

        $this->entityManager->persist($signalement);
        $this->entityManager->flush();

        return ['signalement' => $signalement, 'created' => true];
    }

    /** @return array<string, mixed> */
    public function normalizeForAdmin(Signalement $signalement): array
    {
        $target = $this->resolveTarget($signalement->getTargetType(), $signalement->getTargetId());

        return [
            'id' => $signalement->getId(),
            'targetType' => $signalement->getTargetType()->value,
            'targetTypeLabel' => $signalement->getTargetType()->label(),
            'targetId' => $signalement->getTargetId(),
            'motif' => $signalement->getMotif(),
            'status' => $signalement->getStatus()->value,
            'statusLabel' => $signalement->getStatus()->label(),
            'createdAt' => $signalement->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'resolvedAt' => $signalement->getResolvedAt()?->format(\DateTimeInterface::ATOM),
            'reporter' => $signalement->getReporter() ? $this->normalizer->userPublic($signalement->getReporter()) : null,
            'resolvedBy' => $signalement->getResolvedBy() ? $this->normalizer->userPublic($signalement->getResolvedBy()) : null,
            'target' => $target,
        ];
    }

    public function resolvePendingForTarget(ReportTargetType $targetType, int $targetId, User $admin): void
    {
        $pending = $this->signalementRepository->findBy([
            'targetType' => $targetType,
            'targetId' => $targetId,
            'status' => ReportStatus::PENDING,
        ]);

        $now = new \DateTimeImmutable();
        foreach ($pending as $report) {
            if (!$report instanceof Signalement) {
                continue;
            }
            $report->setStatus(ReportStatus::RESOLVED);
            $report->setResolvedAt($now);
            $report->setResolvedBy($admin);
        }
    }

    private function assertTargetExists(ReportTargetType $targetType, int $targetId): void
    {
        if (null === $this->resolveTargetEntity($targetType, $targetId)) {
            throw new \InvalidArgumentException('Contenu introuvable.');
        }
    }

    /** @return array<string, mixed>|null */
    private function resolveTarget(ReportTargetType $targetType, int $targetId): ?array
    {
        $entity = $this->resolveTargetEntity($targetType, $targetId);
        if (null === $entity) {
            return null;
        }

        if ($entity instanceof Avis) {
            return [
                'type' => 'avis',
                'avis' => $this->normalizer->avis($entity, true),
                'livreId' => $entity->getLivre()?->getId(),
            ];
        }

        $avis = $entity->getAvis();

        return [
            'type' => 'commentaire',
            'commentaire' => $this->normalizer->commentaire($entity),
            'avisId' => $avis?->getId(),
            'livreId' => $avis?->getLivre()?->getId(),
        ];
    }

    private function resolveTargetEntity(ReportTargetType $targetType, int $targetId): Avis|Commentaire|null
    {
        return match ($targetType) {
            ReportTargetType::AVIS => $this->avisRepository->find($targetId),
            ReportTargetType::COMMENTAIRE => $this->commentaireRepository->find($targetId),
        };
    }
}
