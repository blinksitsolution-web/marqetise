<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'group', 'label', 'payload', 'is_visible', 'sort_order'])]
class ContentBlock extends Model
{
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'is_visible' => 'boolean',
        ];
    }
}
