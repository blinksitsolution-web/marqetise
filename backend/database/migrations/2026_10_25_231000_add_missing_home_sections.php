<?php

use App\Support\HomeSectionDefaults;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        foreach (HomeSectionDefaults::blocks() as $block) {
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
    }

    public function down(): void
    {
        foreach (HomeSectionDefaults::blocks() as $block) {
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
    }
};
