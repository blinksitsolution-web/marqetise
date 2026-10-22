<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InquiryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => $this->status,
            'course' => $this->course ? [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'slug' => $this->course->slug,
            ] : null,
            'notes' => $this->whenLoaded('notes', fn () => $this->notes->map(fn ($note) => [
                'id' => $note->id,
                'body' => $note->body,
                'author' => $note->author?->name,
                'created_at' => $note->created_at,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
