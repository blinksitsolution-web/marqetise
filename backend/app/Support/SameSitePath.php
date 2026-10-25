<?php

namespace App\Support;

class SameSitePath
{
    public static function isAllowed(string $value): bool
    {
        if ($value === '') {
            return true;
        }

        if (! str_starts_with($value, '/') || str_starts_with($value, '//')) {
            return false;
        }

        if (str_contains($value, '\\') || preg_match('/[\s\x00-\x1F\x7F]/', $value) === 1) {
            return false;
        }

        return preg_match('#^/(?!/)[^:]*$#', $value) === 1;
    }

    /**
     * @return list<string>
     */
    public static function invalidHrefs(mixed $value, string $key = ''): array
    {
        if (! is_array($value)) {
            if (is_string($value) && self::isHrefKey($key) && ! self::isAllowed($value)) {
                return [$value];
            }

            return [];
        }

        $invalid = [];

        foreach ($value as $childKey => $child) {
            $name = is_string($childKey) ? $childKey : '';
            array_push($invalid, ...self::invalidHrefs($child, $name));
        }

        return $invalid;
    }

    private static function isHrefKey(string $key): bool
    {
        return $key === 'href' || str_ends_with($key, '_href');
    }
}
