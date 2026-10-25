<?php

namespace Tests\Feature;

use App\Mail\BookingReceipt;
use App\Mail\BookingReceived;
use App\Mail\InquiryReceipt;
use App\Mail\InquiryReceived;
use App\Models\Booking;
use App\Models\Inquiry;
use App\Models\Service;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

class VisitorReceiptTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_configured_mailer_sends_a_visitor_receipt_and_a_staff_notice(): void
    {
        config(['mail.default' => 'smtp']);
        Mail::fake();
        Setting::putValue('notification_email', 'staff@example.com', 'private', false);

        $this->postJson('/api/v1/inquiries', $this->inquiry())->assertCreated()
            ->assertJsonPath('email_delivered', true)
            ->assertJsonPath('receipt_sent', true)
            ->assertJsonPath('message', 'Your inquiry has been saved. The team has been notified, and a receipt has been sent to your email.');

        Mail::assertSent(InquiryReceived::class, fn (InquiryReceived $mail) => $mail->hasTo('staff@example.com'));
        Mail::assertSent(InquiryReceipt::class, fn (InquiryReceipt $mail) => $mail->hasTo('jordan@example.com'));

        $this->postJson('/api/v1/bookings', $this->booking())->assertCreated()
            ->assertJsonPath('email_delivered', true)
            ->assertJsonPath('receipt_sent', true);

        Mail::assertSent(BookingReceived::class, fn (BookingReceived $mail) => $mail->hasTo('staff@example.com'));
        Mail::assertSent(BookingReceipt::class, fn (BookingReceipt $mail) => $mail->hasTo('jordan@example.com'));
    }

    public function test_a_receipt_is_still_sent_when_staff_have_no_notification_address(): void
    {
        config(['mail.default' => 'smtp']);
        Mail::fake();

        $this->postJson('/api/v1/inquiries', $this->inquiry())->assertCreated()
            ->assertJsonPath('email_delivered', false)
            ->assertJsonPath('receipt_sent', true)
            ->assertJsonPath('message', 'Your inquiry has been saved. A receipt has been sent to your email. Staff were not emailed because the notification address is not configured.');

        Mail::assertNotSent(InquiryReceived::class);
        Mail::assertSent(InquiryReceipt::class);
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

        Mail::assertNothingSent();
    }

    public function test_smtp_timeout_is_short_and_the_render_blueprint_uses_port_2525(): void
    {
        $mail = file_get_contents(config_path('mail.php'));
        $this->assertIsString($mail);
        $this->assertStringContainsString("env('MAIL_TIMEOUT', 10)", $mail);
        $this->assertStringNotContainsString("'timeout' => null", $mail);
        $this->assertSame(10.0, config('mail.mailers.smtp.timeout'));

        $blueprint = file_get_contents(dirname(base_path()).'/render.yaml');
        $this->assertIsString($blueprint);
        $this->assertMatchesRegularExpression('/key: MAIL_PORT\s+value: "2525"/', $blueprint);
        $this->assertDoesNotMatchRegularExpression('/key: MAIL_PORT\s+value: "587"/', $blueprint);
        $this->assertMatchesRegularExpression('/key: MAIL_TIMEOUT\s+value: "10"/', $blueprint);

        $docs = file_get_contents(dirname(base_path()).'/docs/DEPLOYMENT.md');
        $this->assertIsString($docs);
        $this->assertStringContainsString('ports 25, 465, and 587', $docs);
        $this->assertStringContainsString('2525', $docs);
        $this->assertStringContainsString('Brevo', $docs);
    }

    public function test_a_mail_transport_failure_still_saves_the_inquiry_and_booking(): void
    {
        config(['mail.default' => 'smtp']);
        Setting::putValue('notification_email', 'staff@example.com', 'private', false);

        $pending = \Mockery::mock();
        $pending->shouldReceive('send')->andThrow(new TransportException('Connection timed out'));
        Mail::shouldReceive('to')->andReturn($pending);

        $started = microtime(true);

        $this->postJson('/api/v1/inquiries', $this->inquiry())
            ->assertCreated()
            ->assertJsonPath('email_delivered', false)
            ->assertJsonPath('receipt_sent', false)
            ->assertJsonPath('message', 'Your inquiry has been saved. Email delivery is not configured, so no receipt or team notification was sent.');

        $this->assertLessThan(2, microtime(true) - $started);
        $this->assertSame(1, Inquiry::query()->where('email', 'jordan@example.com')->count());

        $this->postJson('/api/v1/bookings', $this->booking())
            ->assertCreated()
            ->assertJsonPath('email_delivered', false)
            ->assertJsonPath('receipt_sent', false)
            ->assertJsonPath('message', 'Your booking request has been received and is pending confirmation. This is not a confirmed appointment yet. Email delivery is not configured, so no receipt or team notification was sent.');

        $this->assertLessThan(2, microtime(true) - $started);
        $this->assertSame(1, Booking::query()->where('email', 'jordan@example.com')->count());
    }

    public function test_an_smtp_read_timeout_still_returns_the_not_sent_flags(): void
    {
        $server = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
        $this->assertNotFalse($server, $errstr);
        $name = stream_socket_get_name($server, false);
        $this->assertIsString($name);
        $port = (int) substr($name, (int) strrpos($name, ':') + 1);

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.scheme' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => $port,
            'mail.mailers.smtp.timeout' => 1,
            'mail.mailers.smtp.username' => null,
            'mail.mailers.smtp.password' => null,
        ]);
        Mail::purge('smtp');

        Setting::putValue('notification_email', 'staff@example.com', 'private', false);

        try {
            $started = microtime(true);

            $this->postJson('/api/v1/inquiries', $this->inquiry())
                ->assertCreated()
                ->assertJsonPath('email_delivered', false)
                ->assertJsonPath('receipt_sent', false);

            $inquirySeconds = microtime(true) - $started;
            $this->assertGreaterThan(1, $inquirySeconds);
            $this->assertLessThan(8, $inquirySeconds);
            $this->assertSame(1, Inquiry::query()->where('email', 'jordan@example.com')->count());

            $started = microtime(true);

            $this->postJson('/api/v1/bookings', $this->booking())
                ->assertCreated()
                ->assertJsonPath('email_delivered', false)
                ->assertJsonPath('receipt_sent', false);

            $bookingSeconds = microtime(true) - $started;
            $this->assertGreaterThan(1, $bookingSeconds);
            $this->assertLessThan(8, $bookingSeconds);
            $this->assertSame(1, Booking::query()->where('email', 'jordan@example.com')->count());
        } finally {
            fclose($server);
        }
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
