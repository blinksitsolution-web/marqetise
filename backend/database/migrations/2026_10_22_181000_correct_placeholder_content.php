<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('pages')
            ->where('slug', 'privacy')
            ->where('body', 'like', '%Add the finished privacy policy%')
            ->update(['status' => 'draft', 'published_at' => null]);

        DB::table('pages')
            ->where('slug', 'terms')
            ->where('body', 'like', '%Add the finished terms of use%')
            ->update(['status' => 'draft', 'published_at' => null]);

        $hours = DB::table('settings')->where('key', 'hours')->first();

        if ($hours !== null) {
            $value = json_decode((string) $hours->value, true);

            if ($value === 'Weekdays, 9:00–17:00' || $value === 'Weekdays, 9:00-17:00') {
                DB::table('settings')->where('key', 'hours')->update(['value' => json_encode(null)]);
            }
        }

        DB::table('courses')
            ->where('description', 'like', '%This starter record comes from the interface mockups%')
            ->update(['status' => 'draft', 'featured' => false]);

        $process = DB::table('content_blocks')->where('key', 'home.process')->first();

        if ($process !== null) {
            $payload = json_decode((string) $process->payload, true);

            if (is_array($payload) && ($payload['title'] ?? '') === 'A simple, proven process') {
                $payload['title'] = 'A simple process';
                DB::table('content_blocks')->where('id', $process->id)->update([
                    'payload' => json_encode($payload),
                ]);
            }
        }

        $exists = DB::table('content_blocks')->where('key', 'home.focus')->exists();

        if (! $exists) {
            $now = now();
            DB::table('content_blocks')->insert([
                'key' => 'home.focus',
                'group' => 'home',
                'label' => 'Home focus areas',
                'payload' => json_encode([
                    'title' => 'What we work on',
                    'items' => [
                        ['title' => 'Search', 'body' => 'Search visibility and the pages that should earn it.'],
                        ['title' => 'Content', 'body' => 'Content that answers a real question.'],
                        ['title' => 'Paid media', 'body' => 'Paid campaigns tied to a budget and an offer.'],
                        ['title' => 'Training', 'body' => 'Courses and team training that a person reviews.'],
                    ],
                ]),
                'is_visible' => true,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('content_blocks')->where('key', 'home.focus')->delete();
    }
};
