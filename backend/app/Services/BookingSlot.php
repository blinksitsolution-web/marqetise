<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Validation\ValidationException;

class BookingSlot
{
    public function assertAvailable(string $date, string $time, ?int $ignoreId = null, string $field = 'preferred_time'): void
    {
        $taken = Booking::query()
            ->whereDate('preferred_date', $date)
            ->where('preferred_time', $time)
            ->whereIn('status', ['pending', 'confirmed'])
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->lockForUpdate()
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages([
                $field => 'That time is already booked. Choose another time.',
            ]);
        }
    }
}
