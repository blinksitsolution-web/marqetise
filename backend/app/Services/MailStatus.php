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

    public function visitorMessage(string $saved, bool $staffNotified, bool $receiptSent): string
    {
        if ($staffNotified && $receiptSent) {
            return $saved.' The team has been notified, and a receipt has been sent to your email.';
        }

        if ($receiptSent) {
            return $saved.' A receipt has been sent to your email. Staff were not emailed because the notification address is not configured.';
        }

        if ($staffNotified) {
            return $saved.' The team has been notified. A receipt could not be sent.';
        }

        return $saved.' Email delivery is not configured, so no receipt or team notification was sent.';
    }
}
