<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class AboutBannerBlock
{
    /**
     * Optional line under the About heading. Inserted only when missing so a
     * deploy never replaces a line an editor has saved.
     */
    public static function ensure(): void
    {
        if (DB::table('content_blocks')->where('key', 'about.banner')->exists()) {
            return;
        }

        $now = now();
        DB::table('content_blocks')->insert([
            'key' => 'about.banner',
            'group' => 'about',
            'label' => 'Banner',
            'payload' => json_encode(['text' => '']),
            'is_visible' => true,
            'sort_order' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}
