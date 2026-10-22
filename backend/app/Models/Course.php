<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'title', 'slug', 'summary', 'description', 'category', 'level', 'format',
    'duration_label', 'price', 'price_label', 'certificate_included',
    'next_start_date', 'featured', 'status', 'outcomes', 'instructor_name',
    'instructor_title', 'instructor_bio', 'sort_order',
])]
class Course extends Model
{
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'certificate_included' => 'boolean',
            'featured' => 'boolean',
            'next_start_date' => 'date',
            'outcomes' => 'array',
        ];
    }

    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class)->orderBy('sort_order');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
