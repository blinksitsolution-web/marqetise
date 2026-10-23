<?php

return [

    'frontend_url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/'),

    /*
    | Starter courses and illustrative catalog copy are optional.
    | They are taken from the approved interface mockups and are not
    | verified commercial results. Testimonials, statistics, team members,
    | and awards are never seeded.
    */
    'seed_sample_content' => (bool) env('SEED_SAMPLE_CONTENT', false),

    'booking_times' => [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ],

    'reserved_slugs' => [
        'admin', 'api', 'book', 'courses', 'services', 'storage', 'sitemap', 'robots',
        'login', 'sanctum', 'up', 'build', 'assets',
    ],

    'public_setting_keys' => [
        'company_name',
        'tagline',
        'email',
        'phone',
        'address',
        'hours',
        'social_linkedin',
        'social_instagram',
        'social_facebook',
        'social_x',
        'social_youtube',
        'meta_title',
        'meta_description',
        'logo_url',
    ],

];
