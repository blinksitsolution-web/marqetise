<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadMediaRequest;
use App\Models\MediaAsset;
use App\Services\AuditLogger;
use App\Support\SafeText;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MediaAsset::query()->with('uploader:id,name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('original_name', 'like', "%{$search}%")
                  ->orWhere('alt', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('type')) {
            if ($type === 'image') {
                $query->where('mime', 'like', 'image/%');
            } elseif ($type === 'video') {
                $query->where('mime', 'like', 'video/%');
            }
        }

        $perPage = min((int) ($request->query('per_page') ?: 30), 100);
        $media = $query->latest('id')->paginate($perPage);

        return response()->json([
            'data' => collect($media->items())->map(fn ($item) => [
                'id' => $item->id,
                'url' => $item->url(),
                'original_name' => $item->original_name,
                'mime' => $item->mime,
                'size' => $item->size,
                'alt' => $item->alt,
                'created_at' => $item->created_at?->toIso8601String(),
                'uploader' => $item->uploader?->name,
            ]),
            'meta' => [
                'current_page' => $media->currentPage(),
                'last_page' => $media->lastPage(),
                'per_page' => $media->perPage(),
                'total' => $media->total(),
            ],
        ]);
    }

    public function store(UploadMediaRequest $request, AuditLogger $audit): JsonResponse
    {
        $file = $request->file('file');
        $path = $file->store('media', 'public');

        $media = MediaAsset::query()->create([
            'disk' => 'public',
            'path' => $path,
            'original_name' => SafeText::clean($file->getClientOriginalName()) ?: 'asset',
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
                'original_name' => $media->original_name,
            ],
        ], 201);
    }

    public function destroy(MediaAsset $mediaAsset, AuditLogger $audit): JsonResponse
    {
        if (!str_starts_with($mediaAsset->path, 'http://') && !str_starts_with($mediaAsset->path, 'https://')) {
            Storage::disk($mediaAsset->disk)->delete($mediaAsset->path);
        }

        $audit->log('media.deleted', $mediaAsset, ['path' => $mediaAsset->path]);
        $mediaAsset->delete();

        return response()->json(['message' => 'Media asset deleted successfully.']);
    }
}
