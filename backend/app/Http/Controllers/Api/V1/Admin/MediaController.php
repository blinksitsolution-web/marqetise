<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadMediaRequest;
use App\Models\MediaAsset;
use App\Services\AuditLogger;
use App\Support\MediaBytes;
use App\Support\MediaUpload;
use App\Support\SafeText;
use Illuminate\Http\JsonResponse;

class MediaController extends Controller
{
    public function store(UploadMediaRequest $request, AuditLogger $audit): JsonResponse
    {
        $file = $request->file('file');
        $contents = file_get_contents($file->getRealPath());
        $mime = MediaUpload::detectedMime($file->getPathname());
        $extension = MediaUpload::extension($mime);
        $video = in_array($extension, ['mp4', 'webm', 'mov'], true);
        if (! is_string($contents) || $contents === '' || $extension === null) {
            abort(422, $video ? 'The video was not uploaded.' : 'The image was not uploaded.');
        }

        $hash = hash('sha256', $contents);
        $media = MediaAsset::query()->create([
            'disk' => 'database',
            'path' => 'pending',
            'original_name' => SafeText::clean($file->getClientOriginalName()) ?: 'image',
            'mime' => $mime,
            'size' => strlen($contents),
            'hash' => $hash,
            'alt' => SafeText::nullable($request->input('alt')),
            'uploaded_by' => $request->user()->id,
        ]);
        $media->path = '/media/'.$media->id.'-'.$hash.'.'.$extension;
        $media->save();
        MediaBytes::write($media, $contents);

        $audit->log('media.uploaded', $media, ['mime' => $media->mime, 'size' => $media->size]);

        return response()->json([
            'data' => [
                'id' => $media->id,
                'url' => $media->url(),
                'alt' => $media->alt,
                'mime' => $media->mime,
                'size' => $media->size,
            ],
        ], 201);
    }
}
