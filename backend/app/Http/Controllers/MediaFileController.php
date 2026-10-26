<?php

namespace App\Http\Controllers;

use App\Models\MediaAsset;
use App\Support\MediaBytes;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class MediaFileController extends Controller
{
    public function show(Request $request, string $file): Response|SymfonyResponse
    {
        if (preg_match('/^(\d+)-([a-f0-9]{64})\.(jpe?g|png|webp|mp4|webm|mov)$/', $file, $match) !== 1) {
            abort(404);
        }

        $media = MediaAsset::query()->find($match[1]);
        if (! $media || ! is_string($media->hash) || ! hash_equals($media->hash, $match[2])) {
            abort(404);
        }

        $bytes = MediaBytes::read($media);
        if ($bytes === '' || ! hash_equals($media->hash, hash('sha256', $bytes))) {
            abort(404);
        }

        $etag = '"'.$media->hash.'"';
        $headers = [
            'Content-Type' => $media->mime,
            'ETag' => $etag,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ];

        $offered = trim((string) $request->headers->get('If-None-Match'), " \t\"");
        if ($offered !== '' && hash_equals($media->hash, $offered)) {
            return response('', 304, $headers);
        }

        $size = strlen($bytes);
        $range = $this->byteRange((string) $request->headers->get('Range'), $size);
        if ($range === false) {
            return response('', 416, $headers + [
                'Content-Range' => 'bytes */'.$size,
            ]);
        }

        if (is_array($range)) {
            [$start, $end] = $range;
            $slice = substr($bytes, $start, $end - $start + 1);

            return response($slice, 206, $headers + [
                'Content-Length' => (string) strlen($slice),
                'Content-Range' => 'bytes '.$start.'-'.$end.'/'.$size,
            ]);
        }

        return response($bytes, 200, $headers + ['Content-Length' => (string) $size]);
    }

    /**
     * @return array{0: int, 1: int}|null|false null means the whole file
     */
    private function byteRange(string $header, int $size): array|null|false
    {
        $header = trim($header);
        if ($header === '') {
            return null;
        }

        if ($size < 1 || preg_match('/^bytes=(\d*)-(\d*)$/', $header, $match) !== 1) {
            return false;
        }

        $start = $match[1];
        $end = $match[2];
        if ($start === '' && $end === '') {
            return false;
        }

        if ($start === '') {
            $length = (int) $end;
            if ($length < 1) {
                return false;
            }
            $suffix = min($length, $size);

            return [$size - $suffix, $size - 1];
        }

        $from = (int) $start;
        $to = $end === '' ? $size - 1 : (int) $end;
        if ($from >= $size || $from > $to) {
            return false;
        }

        return [$from, min($to, $size - 1)];
    }
}
