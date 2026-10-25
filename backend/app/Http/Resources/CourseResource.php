<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'category' => $this->category,
            'level' => $this->level,
            'format' => $this->format,
            'duration_label' => $this->duration_label,
            'price' => $this->price,
            'price_label' => $this->price_label ?: ($this->price === null ? 'Contact for price' : null),
            'certificate_included' => $this->certificate_included,
            'next_start_date' => $this->next_start_date?->toDateString(),
            'featured' => $this->featured,
            'status' => $this->status,
            'outcomes' => $this->outcomes ?? [],
            'instructor_name' => $this->instructor_name,
            'instructor_title' => $this->instructor_title,
            'instructor_bio' => $this->instructor_bio,
            'image_path' => $this->image_path,
            'sort_order' => $this->sort_order,
            'students_count' => $this->whenCounted('students'),
            'modules' => $this->whenLoaded('modules', fn () => $this->modules->map(fn ($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'summary' => $module->summary,
                'lessons' => $module->lessons ?? [],
                'sort_order' => $module->sort_order,
            ])),
            'updated_at' => $this->updated_at,
        ];
    }
}
