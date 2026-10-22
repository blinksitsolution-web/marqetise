<?php

namespace App\Support;

class FrontendOrigins
{
    /**
     * @return list<string>
     */
    public static function list(string $environment, string $frontendUrl): array
    {
        $origins = [rtrim($frontendUrl, '/')];

        if ($environment === 'local') {
            $origins[] = 'http://localhost:5173';
            $origins[] = 'http://127.0.0.1:5173';
        }

        return array_values(array_unique(array_filter($origins)));
    }
}
