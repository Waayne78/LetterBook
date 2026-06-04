<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Util\IsbnHelper;
use PHPUnit\Framework\TestCase;

final class IsbnHelperTest extends TestCase
{
    public function testNormalizeIsbn13(): void
    {
        self::assertSame('9782070368228', IsbnHelper::normalize('978-2-07-036822-8'));
    }

    public function testIsIsbnQuery(): void
    {
        self::assertTrue(IsbnHelper::isIsbnQuery('9782070368228'));
        self::assertFalse(IsbnHelper::isIsbnQuery('Les Misérables'));
    }

    public function testGoogleQueryPrefixesIsbn(): void
    {
        self::assertSame('isbn:9782070368228', IsbnHelper::googleQuery('9782070368228'));
        self::assertSame('victor hugo', IsbnHelper::googleQuery('victor hugo'));
    }
}
