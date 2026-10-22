<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadMediaRequest;
use App\Models\MediaAsset;
use App\Services\AuditLogger;
use App\Support\SafeText;
use Illuminate\Http\JsonResponse;

class MediaController extends Controller
{
    public function store(UploadMediaRequest $request, AuditLogger $audit): JsonResponse
    {
        $file = $request->file('file');
        $path = $file->store('media', 'public');

        $media = MediaAsset::query()->create([
            'disk' => 'public',
            'path' => $path,
            'original_name' => SafeText::clean($file->getClientOriginalName()) ?: 'image',
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'alt' => SafeText::nullable($request->input('alt')),
            'uploaded_by' => $request->user()->id,
        ]);

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
