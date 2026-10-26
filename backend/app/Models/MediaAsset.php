<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['disk', 'path', 'original_name', 'mime', 'size', 'hash', 'alt', 'uploaded_by'])]
class MediaAsset extends Model
{
    protected $table = 'media';

    protected $hidden = ['bytes'];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function url(): string
    {
        if (is_string($this->path) && str_starts_with($this->path, '/media/')) {
            return $this->path;
        }

        return Storage::disk($this->disk ?: 'public')->url((string) $this->path);
    }
}
