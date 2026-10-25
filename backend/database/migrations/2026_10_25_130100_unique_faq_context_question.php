<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicates = DB::table('faqs')
            ->select('context', 'question')
            ->groupBy('context', 'question')
            ->havingRaw('count(*) > 1')
            ->get();

        if ($duplicates->isNotEmpty()) {
            throw new \RuntimeException(
                'Cannot require a unique FAQ question per context while duplicates exist. Resolve them before migrating.'
            );
        }

        Schema::table('faqs', function (Blueprint $table) {
            $table->unique(['context', 'question']);
        });
    }

    public function down(): void
    {
        Schema::table('faqs', function (Blueprint $table) {
            $table->dropUnique(['context', 'question']);
        });
    }
};
