<?php

declare(strict_types=1);

namespace App\Util;

final class IsbnHelper
{
    public static function normalize(string $raw): ?string
    {
        $digits = preg_replace('/[^0-9Xx]/', '', $raw);
        if ($digits === null || $digits === '') {
            return null;
        }
        $digits = strtoupper($digits);
        $len = strlen($digits);
        if ($len === 10 || $len === 13) {
            return $digits;
        }

        return null;
    }

    public static function isIsbnQuery(string $query): bool
    {
        return self::normalize($query) !== null;
    }

    public static function googleQuery(string $query): string
    {
        $isbn = self::normalize($query);
        if ($isbn !== null) {
            return 'isbn:'.$isbn;
        }

        return trim($query);
    }
}
