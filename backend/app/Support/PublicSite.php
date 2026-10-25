<?php

namespace App\Support;

use Illuminate\Http\Response;

class PublicSite
{
    public static function root(): string
    {
        $candidates = [
            dirname(base_path()).DIRECTORY_SEPARATOR.'frontend',
            '/var/www/site',
        ];

        foreach ($candidates as $dir) {
            if (is_file($dir.DIRECTORY_SEPARATOR.'index.html')) {
                return $dir;
            }
        }

        return $candidates[0];
    }

    public static function file(string $name): ?string
    {
        $path = self::root().DIRECTORY_SEPARATOR.$name;

        return is_file($path) ? $path : null;
    }

    public static function response(string $name, int $status = 200): Response
    {
        $path = self::file($name);
        abort_if($path === null, 404);

        return response((string) file_get_contents($path), $status, [
            'Content-Type' => 'text/html; charset=utf-8',
        ]);
    }
}
