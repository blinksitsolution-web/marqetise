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
        if (preg_match('/^(\d+)-([a-f0-9]{64})\.(jpe?g|png|webp)$/', $file, $match) !== 1) {
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
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ];

        $offered = trim((string) $request->headers->get('If-None-Match'), " \t\"");
        if ($offered !== '' && hash_equals($media->hash, $offered)) {
            return response('', 304, $headers);
        }

        return response($bytes, 200, $headers + ['Content-Length' => (string) strlen($bytes)]);
    }
}
