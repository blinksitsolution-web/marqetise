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

    protected static function booted(): void
    {
        static::saving(function (Booking $booking): void {
            $booking->slot_key = $booking->blockingSlotKey();
        });
    }

    public function blockingSlotKey(): ?string
    {
        if (! in_array($this->status, ['pending', 'confirmed'], true)) {
            return null;
        }

        $date = $this->preferred_date;
        $date = $date instanceof \DateTimeInterface ? $date->format('Y-m-d') : substr((string) $date, 0, 10);
        $time = substr((string) $this->preferred_time, 0, 5);

        if ($date === '' || $time === '') {
            return null;
        }

        return $date.'|'.$time;
    }
}
