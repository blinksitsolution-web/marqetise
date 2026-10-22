<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'email', 'phone', 'status', 'course_id', 'enrolled_on', 'notes'])]
class Student extends Model
{
    protected function casts(): array
    {
        return [
            'enrolled_on' => 'date',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
