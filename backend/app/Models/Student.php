<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'email', 'phone', 'status', 'course_id', 'inquiry_id', 'enrolled_on', 'notes'])]
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

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class);
    }

    public function enrolments(): HasMany
    {
        return $this->hasMany(StudentEnrolment::class);
    }

    public function addCourse(int $courseId, ?string $status = null): void
    {
        if ($courseId < 1 || (int) $this->course_id === $courseId) {
            return;
        }

        if ($this->course_id === null) {
            $this->forceFill(['course_id' => $courseId])->save();

            return;
        }

        $this->enrolments()->firstOrCreate(
            ['course_id' => $courseId],
            [
                'status' => $status ?: $this->status,
                'enrolled_on' => $this->enrolled_on,
            ],
        );
    }
}
