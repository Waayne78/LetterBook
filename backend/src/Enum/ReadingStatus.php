<?php

declare(strict_types=1);

namespace App\Enum;

enum ReadingStatus: string
{
    case A_LIRE = 'a_lire';
    case EN_COURS = 'en_cours';
    case TERMINE = 'termine';

    public function label(): string
    {
        return match ($this) {
            self::A_LIRE => 'À lire',
            self::EN_COURS => 'En cours',
            self::TERMINE => 'Terminé',
        };
    }
}
