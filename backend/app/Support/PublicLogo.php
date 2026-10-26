<?php

namespace App\Support;

class PublicLogo
{
    /**
     * A logo stored on this site is only published when the file is still on disk.
     * Uploads live on the container filesystem, so a redeploy can leave the saved
     * URL pointing at a file that nginx no longer has. The stored setting is kept.
     */
    public static function available(mixed $url): ?string
    {
        if (! is_string($url)) {
            return null;
        }

        $url = trim($url);
        if ($url === '') {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || ! str_starts_with($path, '/storage/')) {
            return $url;
        }

        $relative = ltrim(substr($path, strlen('/storage/')), '/');
        if ($relative === '' || str_contains($relative, '..')) {
            return null;
        }

        return is_file(storage_path('app/public/'.$relative)) ? $url : null;
    }
}
