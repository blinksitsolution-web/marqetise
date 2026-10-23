<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInquiryRequest;
use App\Mail\InquiryReceipt;
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
        $staffNotified = $recipient !== '' && $mail->send($recipient, new InquiryReceived($inquiry));
        $receiptSent = $mail->send($inquiry->email, new InquiryReceipt($inquiry));

        return response()->json([
            'message' => $mail->visitorMessage('Your inquiry has been saved.', $staffNotified, $receiptSent),
            'email_delivered' => $staffNotified,
            'receipt_sent' => $receiptSent,
            'data' => [
                'id' => $inquiry->id,
                'status' => $inquiry->status,
            ],
        ], 201);
    }
}
