<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PRF-001: nullable profile-photo path for customers.
 *
 * Only the generated file name is stored, never the absolute URL, so the
 * public media route can move without a data migration. NULL means the
 * customer has no profile photo and the clients show an initials fallback.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('avatar_path', 255)->nullable()->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('avatar_path');
        });
    }
};
