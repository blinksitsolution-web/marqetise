<?php

use App\Support\LegalCopy;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        LegalCopy::publish();
    }

    public function down(): void
    {
        DB::table('pages')->whereIn('slug', ['privacy', 'terms'])->update([
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
};
