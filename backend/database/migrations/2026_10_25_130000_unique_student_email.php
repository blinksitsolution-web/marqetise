<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicates = DB::table('students')
            ->select('email')
            ->groupBy('email')
            ->havingRaw('count(*) > 1')
            ->pluck('email');

        if ($duplicates->isNotEmpty()) {
            throw new \RuntimeException(
                'Cannot require a unique student email while duplicate emails exist: '.$duplicates->implode(', ')
                .'. Resolve them before migrating. A second course for the same person needs a future enrolment table.'
            );
        }

        Schema::table('students', function (Blueprint $table) {
            $table->unique('email');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });
    }
};
