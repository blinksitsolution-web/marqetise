<?php

namespace App\Support;

class StatusTransition
{
    /**
     * Completed bookings stay completed. A cancelled booking can be reopened,
     * and the slot check still rejects a time that is already taken.
     * The same status is allowed so notes can be saved.
     */
    public static function booking(string $from, string $to): bool
    {
        if ($from === $to) {
            return true;
        }

        return in_array($to, [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['completed', 'cancelled'],
            'cancelled' => ['pending', 'confirmed'],
        ][$from] ?? [], true);
    }

    /**
     * A resolved inquiry can be reopened. A new inquiry can be resolved directly.
     */
    public static function inquiry(string $from, string $to): bool
    {
        if ($from === $to) {
            return true;
        }

        return in_array($to, [
            'new' => ['in_progress', 'resolved'],
            'in_progress' => ['resolved'],
            'resolved' => ['in_progress'],
        ][$from] ?? [], true);
    }
}
