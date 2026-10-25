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
            'tagline' => 'Beyond Marketing',
            'email' => 'hello@marqetise.com',
            'phone' => null,
            'address' => 'Accra, Ghana',
            'hours' => 'Mon – Fri: 8:30 AM – 5:30 PM GMT',
            'social_linkedin' => 'https://linkedin.com/company/marqetise',
            'social_instagram' => 'https://instagram.com/marqetise',
            'social_facebook' => 'https://facebook.com/marqetise',
            'social_x' => 'https://x.com/marqetise',
            'social_youtube' => 'https://youtube.com/@marqetise',
            'meta_title' => 'Marqetise | Beyond Marketing · Digital Solutions, Academy & Cybersecurity',
            'meta_description' => 'A storytelling-led digital solutions business helping businesses grow, equipping people with practical digital skills, and advancing responsible digital practices.',
            'logo_url' => '/storage/media/marqetise-logo.png',
        ];

        foreach ($public as $key => $value) {
            Setting::putValue($key, $value, 'general', true);
        }

        if (! Setting::query()->where('key', 'notification_email')->exists()) {
            Setting::putValue('notification_email', null, 'private', false);
        }
    }
}
