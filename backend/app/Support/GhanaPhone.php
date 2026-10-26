<?php

namespace App\Support;

use Illuminate\Http\Request;

class GhanaPhone
{
    public const MESSAGE = 'Enter a valid Ghanaian phone number, e.g. 024 123 4567 or +233 24 123 4567.';

    /** @var list<string> */
    private const MOBILE_PREFIXES = ['20', '23', '24', '25', '26', '27', '28', '50', '53', '54', '55', '56', '57', '59'];

    public static function normalize(mixed $value): ?string
    {
        $national = self::national($value);

        return $national === null ? null : '+233'.$national;
    }

    public static function format(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return $value;
        }

        $national = self::national($trimmed);
        if ($national === null) {
            return $trimmed;
        }

        return '+233 '.substr($national, 0, 2).' '.substr($national, 2, 3).' '.substr($national, 5);
    }

    public static function prepare(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        return self::normalize($trimmed) ?? $trimmed;
    }

    public static function mergeNormalized(Request $request, string ...$keys): void
    {
        $clean = [];

        foreach ($keys as $key) {
            if (! $request->exists($key)) {
                continue;
            }

            $value = $request->input($key);
            if (! is_string($value)) {
                continue;
            }

            $clean[$key] = self::prepare($value);
        }

        if ($clean !== []) {
            $request->merge($clean);
        }
    }

    private static function national(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $compact = preg_replace('/[\s().\-]/', '', trim($value)) ?? '';
        if ($compact === '' || preg_match('/^\+?\d+$/', $compact) !== 1) {
            return null;
        }

        if (str_starts_with($compact, '+')) {
            $compact = substr($compact, 1);
        }

        if (str_starts_with($compact, '233') && strlen($compact) === 12) {
            $national = substr($compact, 3);
        } elseif (str_starts_with($compact, '0') && strlen($compact) === 10) {
            $national = substr($compact, 1);
        } else {
            return null;
        }

        $prefix = substr($national, 0, 2);
        $landline = str_starts_with($prefix, '3');
        if (! $landline && ! in_array($prefix, self::MOBILE_PREFIXES, true)) {
            return null;
        }

        return $national;
    }
}
