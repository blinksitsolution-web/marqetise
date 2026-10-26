<?php

namespace App\Support;

class MediaUpload
{
    public const IMAGE_LIMIT = 5 * 1024 * 1024;

    public const VIDEO_LIMIT = 25 * 1024 * 1024;

    public static function detectedMime(string $path): string
    {
        if ($path === '' || ! is_file($path)) {
            return '';
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        return is_string($mime) ? $mime : '';
    }

    public static function extension(string $mime): ?string
    {
        return match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'video/mp4', 'application/mp4' => 'mp4',
            'video/webm' => 'webm',
            'video/quicktime' => 'mov',
            default => null,
        };
    }

    public static function rejection(string $mime, int $size): ?string
    {
        $extension = self::extension($mime);
        if ($extension === null) {
            return 'Use a JPEG, PNG, or WebP image, or an MP4, WebM, or MOV video.';
        }

        $video = in_array($extension, ['mp4', 'webm', 'mov'], true);
        $limit = $video ? self::VIDEO_LIMIT : self::IMAGE_LIMIT;
        if ($size > $limit) {
            return $video
                ? 'The video must be 25 MB or smaller.'
                : 'The image must be 5 MB or smaller.';
        }

        return null;
    }
}
