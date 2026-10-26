<?php

namespace App\Support;

use App\Models\MediaAsset;

class PublicMedia
{
    public static function publish(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $path = self::usable($value);
        if ($path === '') {
            return '';
        }

        if (str_starts_with($path, '/')) {
            return url($path);
        }

        return $path;
    }

    public static function usable(mixed $value): string
    {
        if (! is_string($value)) {
            return '';
        }

        $value = trim($value);
        if ($value === '' || str_contains($value, '..') || preg_match('/[\s\\\\]/', $value) === 1) {
            return '';
        }

        if (str_starts_with($value, 'images/')) {
            return $value;
        }

        $path = parse_url($value, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return '';
        }

        if (str_starts_with($path, '/storage/')) {
            return PublicLogo::available($value) ? $path : '';
        }

        if (preg_match('#^/media/(\d+)-([a-f0-9]{64})\.(?:jpe?g|png|webp|mp4|webm|mov)$#', $path, $match) === 1) {
            $stored = MediaAsset::query()->whereKey($match[1])->where('hash', $match[2])->whereNotNull('bytes')->exists();

            return $stored ? $path : '';
        }

        if (preg_match('#^https?://#i', $value) === 1) {
            return $value;
        }

        return '';
    }

    public static function present(mixed $value, string $key = ''): mixed
    {
        if (is_array($value)) {
            $next = [];
            foreach ($value as $childKey => $child) {
                $name = is_string($childKey) ? $childKey : '';
                $next[$childKey] = self::present($child, $name);
            }

            return $next;
        }

        if ($key === 'video_url') {
            $published = self::publishVideo($value);

            return $published === '' ? null : $published;
        }

        if (! self::isImageKey($key)) {
            return $value;
        }

        $published = self::publish($value);

        return $published === '' ? null : $published;
    }

    private static function publishVideo(mixed $value): string
    {
        if (! is_string($value)) {
            return '';
        }

        $embed = YouTubeUrl::embed($value);
        if ($embed !== null) {
            return $embed;
        }

        $path = self::usable($value);
        if ($path === '' || preg_match('#^/media/\d+-[a-f0-9]{64}\.(?:mp4|webm|mov)$#', $path) !== 1) {
            return '';
        }

        return str_starts_with($path, '/') ? url($path) : $path;
    }

    private static function isImageKey(string $key): bool
    {
        return in_array($key, ['image', 'image_path', 'banner_image', 'logo_url'], true);
    }
}
