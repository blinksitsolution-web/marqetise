<?php

return [

    'frontend_url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/'),

    /*
    | Comma-separated proxy addresses. Empty means forwarded headers are ignored.
    | Set this only to the TLS terminator in front of PHP. Do not use "*".
    */
    'trusted_proxies' => array_values(array_filter(array_map(
        trim(...),
        explode(',', (string) env('TRUSTED_PROXIES', ''))
    ), fn (string $proxy) => $proxy !== '' && $proxy !== '*')),

    /*
    | Off until the operator turns it on. The scheduled command writes under
    | storage/app/backups, which is not web-accessible. Copy those files off
    | the server. Do not point this at a public directory.
    */
    'backup_enabled' => filter_var(env('BACKUP_ENABLED', false), FILTER_VALIDATE_BOOLEAN),

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

    'private_setting_keys' => [
        'notification_email',
        'ip_retention_days',
    ],

];
