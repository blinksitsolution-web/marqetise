<?php

use App\Support\PublicContentDefaults;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        foreach (PublicContentDefaults::blocks() as $block) {
            if (DB::table('content_blocks')->where('key', $block['key'])->exists()) {
                continue;
            }

            DB::table('content_blocks')->insert([
                'key' => $block['key'],
                'group' => $block['group'],
                'label' => $block['label'],
                'payload' => json_encode($block['payload']),
                'is_visible' => $block['is_visible'],
                'sort_order' => $block['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        foreach (PublicContentDefaults::pages() as $page) {
            if (DB::table('pages')->where('slug', $page['slug'])->exists()) {
                continue;
            }

            DB::table('pages')->insert([
                'title' => $page['title'],
                'slug' => $page['slug'],
                'excerpt' => $page['excerpt'],
                'body' => $page['body'],
                'meta_title' => $page['title'].' · Marqetise',
                'meta_description' => '',
                'status' => 'published',
                'published_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        foreach (PublicContentDefaults::blocks() as $block) {
            $row = DB::table('content_blocks')->where('key', $block['key'])->first();

            if (! $row) {
                continue;
            }

            $payload = json_decode((string) $row->payload, true);
            $untouched = $payload === $block['payload'] && (bool) $row->is_visible === $block['is_visible'];

            if ($untouched) {
                DB::table('content_blocks')->where('key', $block['key'])->delete();
            }
        }

        foreach (PublicContentDefaults::pages() as $page) {
            $row = DB::table('pages')->where('slug', $page['slug'])->first();

            if (! $row) {
                continue;
            }

            $untouched = $row->title === $page['title']
                && (string) $row->excerpt === ''
                && (string) $row->body === '';

            if ($untouched) {
                DB::table('pages')->where('slug', $page['slug'])->delete();
            }
        }
    }
};
