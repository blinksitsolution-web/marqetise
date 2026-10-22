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

        if (in_array((string) config('mail.default'), ['log', 'array'], true)) {
            throw new RuntimeException('Production cannot use the log or array mailer.');
        }
    }
}
