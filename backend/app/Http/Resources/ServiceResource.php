<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'icon' => $this->icon,
            'starting_price' => $this->starting_price,
            'duration_label' => $this->duration_label,
            'status' => $this->status,
            'sort_order' => $this->sort_order,
        ];
    }
}
