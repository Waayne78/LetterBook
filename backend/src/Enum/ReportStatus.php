<?php

declare(strict_types=1);

namespace App\Enum;

enum ReportStatus: string
{
    case PENDING = 'pending';
    case RESOLVED = 'resolved';
    case DISMISSED = 'dismissed';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'En attente',
            self::RESOLVED => 'Traité',
            self::DISMISSED => 'Rejeté',
        };
    }
}
