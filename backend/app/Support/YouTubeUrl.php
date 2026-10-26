<?php

namespace App\Support;

class YouTubeUrl
{
    public static function embed(string $value): ?string
    {
        $value = trim($value);
        if ($value === '' || preg_match('/[\s\x00-\x1F\\\\]/', $value) === 1) {
            return null;
        }

        if (preg_match('#^https?://#i', $value) !== 1) {
            return null;
        }

        $parts = parse_url($value);
        if (! is_array($parts) || ! isset($parts['host']) || ! is_string($parts['host'])) {
            return null;
        }

        $host = strtolower($parts['host']);
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        $path = is_string($parts['path'] ?? null) ? $parts['path'] : '';
        $id = '';

        if ($host === 'youtu.be') {
            $id = explode('/', trim($path, '/'))[0] ?? '';
        } elseif (in_array($host, ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'], true)) {
            if (preg_match('#^/(?:shorts|embed|live)/([^/?]+)#', $path, $match) === 1) {
                $id = $match[1];
            } elseif ($path === '/watch' || str_starts_with($path, '/watch/')) {
                parse_str(is_string($parts['query'] ?? null) ? $parts['query'] : '', $query);
                $id = is_string($query['v'] ?? null) ? $query['v'] : '';
            }
        } else {
            return null;
        }

        if (preg_match('/^[A-Za-z0-9_-]{11}$/', $id) !== 1) {
            return null;
        }

        return 'https://www.youtube.com/embed/'.$id;
    }
}
