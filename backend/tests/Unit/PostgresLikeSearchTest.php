<?php

namespace Tests\Unit;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The catalog and admin search filters must be case-insensitive on every
 * supported engine. SQLite and MySQL happen to make LIKE case-insensitive,
 * but PostgreSQL's LIKE is case-sensitive, so the query builder must emit
 * `ilike` there. This guards the PostgreSQL-specific behaviour that the
 * SQLite-backed feature tests cannot observe.
 */
class PostgresLikeSearchTest extends TestCase
{
    public function test_search_filter_compiles_to_ilike_on_postgresql(): void
    {
        $sql = DB::connection('pgsql')
            ->query()
            ->from('products')
            ->whereLike('name', '%bag%', caseSensitive: false)
            ->toSql();

        $this->assertStringContainsString('ilike', $sql);
    }

    public function test_search_filter_stays_like_on_mysql(): void
    {
        $sql = DB::connection('mysql')
            ->query()
            ->from('products')
            ->whereLike('name', '%bag%', caseSensitive: false)
            ->toSql();

        $this->assertStringContainsString('like', $sql);
        $this->assertStringNotContainsString('ilike', $sql);
    }
}
