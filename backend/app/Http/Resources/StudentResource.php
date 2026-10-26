<?php

namespace App\Http\Resources;

use App\Support\GhanaPhone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => GhanaPhone::format($this->phone),
            'status' => $this->status,
            'enrolled_on' => $this->enrolled_on?->toDateString(),
            'notes' => $this->when(
                $request->user()?->hasPermission('students.view') || $request->user()?->hasPermission('students.manage'),
                $this->notes,
            ),
            'course' => $this->course ? [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'slug' => $this->course->slug,
            ] : null,
            'other_courses' => $this->whenLoaded('enrolments', fn () => $this->enrolments
                ->map(fn ($enrolment) => $enrolment->course ? [
                    'id' => $enrolment->course->id,
                    'title' => $enrolment->course->title,
                ] : null)
                ->filter()
                ->values()),
            'created_at' => $this->created_at,
        ];
    }
}
