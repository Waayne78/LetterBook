<?php

declare(strict_types=1);

namespace App\Enum;

enum ReportTargetType: string
{
    case AVIS = 'avis';
    case COMMENTAIRE = 'commentaire';

    public function label(): string
    {
        return match ($this) {
            self::AVIS => 'Avis',
            self::COMMENTAIRE => 'Commentaire',
        };
    }
}
