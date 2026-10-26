<?php

namespace App\Http\Resources;

use App\Support\GhanaPhone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'service_id' => $this->service_id,
            'service_name' => $this->service_name,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => GhanaPhone::format($this->phone),
            'company' => $this->company,
            'website' => $this->website,
            'budget' => $this->budget,
            'goals' => $this->goals,
            'format' => $this->format,
            'preferred_date' => $this->preferred_date?->toDateString(),
            'preferred_time' => $this->preferred_time,
            'status' => $this->status,
            'assigned_to' => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null,
            'internal_notes' => $this->internal_notes,
            'cancellation_reason' => $this->cancellation_reason,
            'created_at' => $this->created_at,
        ];
    }
}
