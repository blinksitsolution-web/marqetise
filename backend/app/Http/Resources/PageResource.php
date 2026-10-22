<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'status' => $this->status,
            'published_at' => $this->published_at,
            'updated_at' => $this->updated_at,
        ];

        if ($request->user() && $this->relationLoaded('editor')) {
            $data['editor'] = $this->editor?->name;
        }

        return $data;
    }
}
