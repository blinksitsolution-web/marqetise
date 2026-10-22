<?php

namespace App\Support;

class SafeText
{
    public static function clean(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = strip_tags($value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? $value;

        return trim($value);
    }

    public static function cleanMixed(mixed $value): mixed
    {
        if (is_string($value)) {
            return self::clean($value);
        }

        if (! is_array($value)) {
            return $value;
        }

        $clean = [];

        foreach ($value as $key => $item) {
            if (! is_string($key) && ! is_int($key)) {
                continue;
            }

            if (is_string($key) && ! preg_match('/^[A-Za-z0-9_.-]{1,80}$/', $key)) {
                continue;
            }

            $clean[$key] = self::cleanMixed($item);
        }

        return $clean;
    }

    public static function nullable(mixed $value): ?string
    {
        $clean = self::clean(is_string($value) ? $value : null);

        return $clean === '' ? null : $clean;
    }
}
