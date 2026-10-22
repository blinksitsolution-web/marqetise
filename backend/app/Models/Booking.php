<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'reference', 'service_id', 'service_name', 'name', 'email', 'phone',
    'company', 'website', 'budget', 'goals', 'format', 'preferred_date',
    'preferred_time', 'status', 'assigned_to', 'internal_notes',
    'cancellation_reason', 'consent',
])]
class Booking extends Model
{
    protected function casts(): array
    {
        return [
            'preferred_date' => 'date',
            'consent' => 'boolean',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
