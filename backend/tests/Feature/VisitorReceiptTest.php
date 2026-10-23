<?php

namespace Tests\Feature;

use App\Mail\BookingReceipt;
use App\Mail\BookingReceived;
use App\Mail\InquiryReceipt;
use App\Mail\InquiryReceived;
use App\Models\Service;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class VisitorReceiptTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_configured_mailer_queues_a_visitor_receipt_and_a_staff_notice(): void
    {
        config(['mail.default' => 'smtp']);
        Mail::fake();
        Setting::putValue('notification_email', 'staff@example.com', 'private', false);

        $this->postJson('/api/v1/inquiries', $this->inquiry())->assertCreated()
            ->assertJsonPath('email_delivered', true)
            ->assertJsonPath('receipt_sent', true)
            ->assertJsonPath('message', 'Your inquiry has been saved. The team has been notified, and a receipt has been sent to your email.');

        Mail::assertQueued(InquiryReceived::class, fn (InquiryReceived $mail) => $mail->hasTo('staff@example.com'));
        Mail::assertQueued(InquiryReceipt::class, fn (InquiryReceipt $mail) => $mail->hasTo('jordan@example.com'));

        $this->postJson('/api/v1/bookings', $this->booking())->assertCreated()
            ->assertJsonPath('email_delivered', true)
            ->assertJsonPath('receipt_sent', true);

        Mail::assertQueued(BookingReceived::class, fn (BookingReceived $mail) => $mail->hasTo('staff@example.com'));
        Mail::assertQueued(BookingReceipt::class, fn (BookingReceipt $mail) => $mail->hasTo('jordan@example.com'));
    }

    public function test_a_receipt_is_still_queued_when_staff_have_no_notification_address(): void
    {
        config(['mail.default' => 'smtp']);
        Mail::fake();

        $this->postJson('/api/v1/inquiries', $this->inquiry())->assertCreated()
            ->assertJsonPath('email_delivered', false)
            ->assertJsonPath('receipt_sent', true)
            ->assertJsonPath('message', 'Your inquiry has been saved. A receipt has been sent to your email. Staff were not emailed because the notification address is not configured.');

        Mail::assertNotQueued(InquiryReceived::class);
        Mail::assertQueued(InquiryReceipt::class);
    }

    public function test_no_receipt_is_claimed_when_mail_cannot_be_delivered(): void
    {
        config(['mail.default' => 'array']);
        Mail::fake();
        Setting::putValue('notification_email', 'staff@example.com', 'private', false);

        $this->postJson('/api/v1/inquiries', $this->inquiry())->assertCreated()
            ->assertJsonPath('email_delivered', false)
            ->assertJsonPath('receipt_sent', false)
            ->assertJsonPath('message', 'Your inquiry has been saved. Email delivery is not configured, so no receipt or team notification was sent.');

        Mail::assertNothingQueued();
    }

    /**
     * @return array<string, mixed>
     */
    private function inquiry(): array
    {
        return [
            'type' => 'other',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'subject' => 'SEO help',
            'message' => 'We would like help with the search visibility of our store.',
            'consent' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function booking(): array
    {
        $service = Service::query()->create([
            'name' => 'SEO',
            'slug' => 'seo',
            'summary' => 'Search work',
            'icon' => 'search',
            'status' => 'published',
        ]);

        return [
            'service_id' => $service->id,
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'video',
            'preferred_date' => now()->next('Monday')->toDateString(),
            'preferred_time' => '10:00',
            'consent' => true,
        ];
    }
}
