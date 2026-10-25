<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\ValidationException;

class BookingSlot
{
    public const TAKEN_MESSAGE = 'That time is already booked. Choose another time.';

    public function assertAvailable(string $date, string $time, ?int $ignoreId = null, string $field = 'preferred_time'): void
    {
        $taken = Booking::query()
            ->where('preferred_date', $date)
            ->where('preferred_time', $time)
            ->whereIn('status', ['pending', 'confirmed'])
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->lockForUpdate()
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages([
                $field => self::TAKEN_MESSAGE,
            ]);
        }
    }

    public function denyIfSlotTaken(UniqueConstraintViolationException $exception, string $field = 'preferred_time'): never
    {
        if (! str_contains($exception->getMessage(), 'slot_key')) {
            throw $exception;
        }

        throw ValidationException::withMessages([
            $field => self::TAKEN_MESSAGE,
        ]);
    }
}
