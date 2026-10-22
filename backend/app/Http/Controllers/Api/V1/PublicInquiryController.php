<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInquiryRequest;
use App\Mail\InquiryReceived;
use App\Models\Inquiry;
use App\Models\Setting;
use App\Services\MailStatus;
use Illuminate\Http\JsonResponse;

class PublicInquiryController extends Controller
{
    public function store(StoreInquiryRequest $request, MailStatus $mail): JsonResponse
    {
        $inquiry = Inquiry::query()->create([
            ...$request->safe()->only(['type', 'name', 'email', 'phone', 'subject', 'message', 'course_id']),
            'status' => 'new',
            'consent' => true,
            'ip_address' => $request->ip(),
        ]);

        $inquiry->load('course');
        $recipient = (string) Setting::getValue('notification_email', '');
        $delivered = $recipient !== '' && $mail->send($recipient, new InquiryReceived($inquiry));

        return response()->json([
            'message' => $delivered
                ? 'Your inquiry has been saved and the team has been notified.'
                : 'Your inquiry has been saved. Email delivery is not configured, so no notification email was sent.',
            'email_delivered' => $delivered,
            'data' => [
                'id' => $inquiry->id,
                'status' => $inquiry->status,
            ],
        ], 201);
    }
}
