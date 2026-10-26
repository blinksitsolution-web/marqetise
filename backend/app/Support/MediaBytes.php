<?php

namespace App\Support;

use App\Models\MediaAsset;
use Illuminate\Support\Facades\DB;

class MediaBytes
{
    public static function write(MediaAsset $media, string $contents): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::update('update media set bytes = decode(?, \'hex\') where id = ?', [bin2hex($contents), $media->id]);

            return;
        }

        DB::table('media')->where('id', $media->id)->update(['bytes' => $contents]);
    }

    public static function read(MediaAsset $media): string
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            $row = DB::selectOne('select encode(bytes, \'hex\') as encoded from media where id = ?', [$media->id]);
            $encoded = is_object($row) ? ($row->encoded ?? '') : '';
            if (! is_string($encoded) || $encoded === '') {
                return '';
            }
            $binary = hex2bin($encoded);

            return $binary === false ? '' : $binary;
        }

        $raw = DB::table('media')->where('id', $media->id)->value('bytes');
        if (is_resource($raw)) {
            $contents = stream_get_contents($raw);

            return $contents === false ? '' : $contents;
        }

        return is_string($raw) ? $raw : '';
    }
}
