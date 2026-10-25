<?php

use App\Support\TemplateDemoDefaults;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        TemplateDemoDefaults::sync();
    }

    public function down(): void
    {
        foreach (TemplateDemoDefaults::blocks() as $block) {
            $row = DB::table('content_blocks')->where('key', $block['key'])->first();

            if (! $row) {
                continue;
            }

            $payload = json_decode((string) $row->payload, true);

            if ($payload !== $block['payload'] || ! (bool) $row->is_visible) {
                continue;
            }

            DB::table('content_blocks')->where('key', $block['key'])->update([
                'payload' => json_encode(self::shell($block['key'])),
                'is_visible' => false,
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function shell(string $key): array
    {
        return match ($key) {
            'home.stats' => [
                'title' => 'Results',
                'items' => [],
                'note' => 'Leave this hidden until real figures are supplied. Do not publish placeholder statistics.',
            ],
            'home.testimonials' => [
                'title' => 'What clients and students say',
                'items' => [],
                'note' => 'Add a testimonial only when you have permission to publish it.',
            ],
            'home.cta' => [
                'title' => '',
                'body' => '',
                'primary_label' => '',
                'primary_href' => '',
                'secondary_label' => '',
                'secondary_href' => '',
            ],
            'packages.plans' => [
                'title' => '',
                'intro' => '',
                'items' => [],
            ],
            default => [
                'title' => '',
                'items' => [],
            ],
        };
    }
};
