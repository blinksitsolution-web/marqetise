<?php

namespace App\Services;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MailStatus
{
    public function canDeliver(): bool
    {
        return ! in_array(config('mail.default'), ['log', 'array'], true);
    }

    public function send(string $to, Mailable $mailable): bool
    {
        if (! $this->canDeliver() || $to === '') {
            return false;
        }

        try {
            Mail::to($to)->send($mailable);

            return true;
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }
}
