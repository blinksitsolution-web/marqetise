<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value', 'group', 'is_public'])]
class Setting extends Model
{
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->where('key', $key)->first();

        if ($setting === null) {
            return $default;
        }

        return static::decodeStored($setting->value, $default);
    }

    public static function decodeStored(mixed $value, mixed $default = null): mixed
    {
        if ($value === null || $value === '') {
            return $default;
        }

        $decoded = json_decode((string) $value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }

    public static function putValue(string $key, mixed $value, string $group = 'general', bool $isPublic = false): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            [
                'value' => json_encode($value),
                'group' => $group,
                'is_public' => $isPublic,
            ],
        );
    }
}
