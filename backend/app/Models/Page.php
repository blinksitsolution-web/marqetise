<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'title', 'slug', 'excerpt', 'body', 'meta_title', 'meta_description',
    'status', 'published_at', 'updated_by',
])]
class Page extends Model
{
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
