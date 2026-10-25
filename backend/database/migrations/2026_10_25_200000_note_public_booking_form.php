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

        $body = LegalCopy::notePublicBookingForm((string) $page->body);
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
        if ($page === null || ! str_contains((string) $page->body, LegalCopy::BOOKING_FORM_PRESENT)) {
            return;
        }

        DB::table('pages')->where('id', $page->id)->update([
            'body' => str_replace(LegalCopy::BOOKING_FORM_PRESENT, LegalCopy::BOOKING_FORM_ABSENT, (string) $page->body),
            'updated_at' => now(),
        ]);
    }
};
