<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $public = [
            'company_name' => 'Marqetise',
            'tagline' => 'Digital marketing services and practical training for growing businesses.',
            'email' => null,
            'phone' => null,
            'address' => null,
            'hours' => null,
            'social_linkedin' => null,
            'social_instagram' => null,
            'social_facebook' => null,
            'social_x' => null,
            'social_youtube' => null,
            'meta_title' => 'Marqetise',
            'meta_description' => 'Digital marketing services, strategy, and training.',
            'logo_url' => null,
        ];

        foreach ($public as $key => $value) {
            if (! Setting::query()->where('key', $key)->exists()) {
                Setting::putValue($key, $value, 'general', true);
            }
        }

        if (! Setting::query()->where('key', 'notification_email')->exists()) {
            Setting::putValue('notification_email', null, 'private', false);
        }
    }
}
