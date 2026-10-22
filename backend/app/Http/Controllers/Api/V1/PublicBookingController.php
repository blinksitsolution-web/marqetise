<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Mail\BookingReceived;
use App\Models\Booking;
use App\Models\Service;
use App\Models\Setting;
use App\Services\MailStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PublicBookingController extends Controller
{
    public function store(StoreBookingRequest $request, MailStatus $mail): JsonResponse
    {
        $service = Service::query()->published()->findOrFail($request->integer('service_id'));

        $booking = DB::transaction(function () use ($request, $service) {
            return Booking::query()->create([
                ...$request->safe()->only([
                    'name', 'email', 'phone', 'company', 'website', 'budget', 'goals',
                    'format', 'preferred_date', 'preferred_time',
                ]),
                'service_id' => $service->id,
                'service_name' => $service->name,
                'reference' => $this->reference(),
                'status' => 'pending',
                'consent' => true,
            ]);
        });

        $recipient = (string) Setting::getValue('notification_email', '');
        $delivered = $recipient !== '' && $mail->send($recipient, new BookingReceived($booking));

        return response()->json([
            'message' => 'Your booking request has been received and is pending confirmation. This is not a confirmed appointment yet.',
            'email_delivered' => $delivered,
            'data' => [
                'reference' => $booking->reference,
                'status' => $booking->status,
                'preferred_date' => $booking->preferred_date?->toDateString(),
                'preferred_time' => $booking->preferred_time,
                'service_name' => $booking->service_name,
            ],
        ], 201);
    }

    private function reference(): string
    {
        do {
            $reference = 'MQ-'.now()->format('Y').'-'.str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Booking::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
