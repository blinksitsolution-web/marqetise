<?php

namespace App\Support;

use RuntimeException;

class ProductionConfiguration
{
    public function assertSafe(): void
    {
        if (! app()->environment('production')) {
            return;
        }

        if (config('app.debug')) {
            throw new RuntimeException('Production cannot run with APP_DEBUG enabled.');
        }

        if (! config('session.secure')) {
            throw new RuntimeException('Production session cookies must be secure.');
        }

        $stateful = config('sanctum.stateful', []);
        if (is_string($stateful)) {
            $stateful = explode(',', $stateful);
        }

        foreach ($stateful as $domain) {
            $host = strtolower(trim((string) $domain));

            if (str_contains($host, 'localhost') || str_contains($host, '127.0.0.1')) {
                throw new RuntimeException('Production SANCTUM_STATEFUL_DOMAINS cannot include localhost.');
            }
        }

        if (in_array((string) config('mail.default'), ['log', 'array'], true)) {
            throw new RuntimeException('Production cannot use the log or array mailer.');
        }
    }
}
