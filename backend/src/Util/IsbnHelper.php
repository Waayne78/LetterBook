<?php

declare(strict_types=1);

namespace App\Util;

final class IsbnHelper
{
    public static function normalize(string $raw): ?string
    {
        $digits = preg_replace('/[^0-9Xx]/', '', $raw);
        if (null === $digits || '' === $digits) {
            return null;
        }
        $digits = strtoupper($digits);
        $len = strlen($digits);
        if (10 === $len || 13 === $len) {
            return $digits;
        }

        return null;
    }

    public static function isIsbnQuery(string $query): bool
    {
        return null !== self::normalize($query);
    }

    public static function googleQuery(string $query): string
    {
        $isbn = self::normalize($query);
        if (null !== $isbn) {
            return 'isbn:'.$isbn;
        }

        return trim($query);
    }
}
