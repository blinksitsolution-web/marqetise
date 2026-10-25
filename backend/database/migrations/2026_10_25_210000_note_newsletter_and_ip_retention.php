<?php

use App\Support\LegalCopy;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $page = DB::table('pages')->where('slug', 'privacy')->first();
        if ($page === null) {
            return;
        }

        $body = LegalCopy::noteCurrentPublicCopy((string) $page->body);
        if ($body === $page->body) {
            return;
        }

        DB::table('pages')->where('id', $page->id)->update([
            'body' => $body,
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        $page = DB::table('pages')->where('slug', 'privacy')->first();
        if ($page === null) {
            return;
        }

        $body = str_replace(
            [LegalCopy::NEWSLETTER_BOX_ABSENT, LegalCopy::IP_RETENTION_CONFIGURABLE],
            [LegalCopy::NEWSLETTER_BOX_PRESENT, LegalCopy::IP_RETENTION_UNSET],
            (string) $page->body,
        );

        if ($body === $page->body) {
            return;
        }

        DB::table('pages')->where('id', $page->id)->update([
            'body' => $body,
            'updated_at' => now(),
        ]);
    }
};
