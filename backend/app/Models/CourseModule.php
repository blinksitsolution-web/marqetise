<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['course_id', 'title', 'summary', 'lessons', 'sort_order'])]
class CourseModule extends Model
{
    protected function casts(): array
    {
        return [
            'lessons' => 'array',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
