<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class BookingSlotTest extends TestCase
{
    use RefreshDatabase;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = Service::query()->create([
            'name' => 'SEO',
            'slug' => 'seo',
            'summary' => 'Search work',
            'icon' => 'search',
            'status' => 'published',
        ]);
    }

    public function test_a_second_booking_for_the_same_slot_is_rejected(): void
    {
        $this->book('10:00', 'jordan@example.com')->assertCreated();

        $this->book('10:00', 'other@example.com')->assertUnprocessable()
            ->assertJsonPath('errors.preferred_time.0', 'That time is already booked. Choose another time.');

        $this->assertSame(1, Booking::query()->count());
    }

    public function test_a_different_time_and_a_cancelled_booking_leave_the_slot_open(): void
    {
        $first = $this->book('10:00', 'jordan@example.com')->assertCreated();
        $booking = Booking::query()->where('reference', $first->json('data.reference'))->firstOrFail();
        $booking->update(['status' => 'cancelled']);
        $this->assertNull($booking->fresh()->slot_key);

        $this->book('10:00', 'other@example.com')->assertCreated();
        $this->book('11:00', 'third@example.com')->assertCreated();
    }

    public function test_staff_cannot_confirm_a_booking_onto_a_taken_slot(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $admin = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'administrator')->value('id'),
            'status' => 'active',
        ]);

        $this->book('14:00', 'held@example.com')->assertCreated();
        $this->book('15:00', 'later@example.com')->assertCreated();

        $open = Booking::query()->where('email', 'later@example.com')->firstOrFail();
        $open->update([
            'preferred_time' => '14:00',
            'status' => 'cancelled',
        ]);

        $this->actingAs($admin)
            ->withHeader('origin', 'http://localhost')
            ->withHeader('referer', 'http://localhost')
            ->patchJson('/api/v1/admin/bookings/'.$open->id, [
                'status' => 'confirmed',
            ])->assertUnprocessable()
            ->assertJsonPath('errors.status.0', 'That time is already booked. Choose another time.');

        $this->assertSame('cancelled', $open->fresh()->status);
    }

    public function test_a_completed_booking_releases_the_slot_key(): void
    {
        $created = $this->book('10:00', 'jordan@example.com')->assertCreated();
        $booking = Booking::query()->where('reference', $created->json('data.reference'))->firstOrFail();
        $booking->update(['status' => 'completed']);

        $this->assertNull($booking->fresh()->slot_key);
        $this->book('10:00', 'other@example.com')->assertCreated();
    }

    public function test_the_database_rejects_a_second_pending_row_for_the_same_slot(): void
    {
        $created = $this->book('10:00', 'jordan@example.com')->assertCreated();
        $existing = Booking::query()->where('reference', $created->json('data.reference'))->firstOrFail();

        $this->expectException(UniqueConstraintViolationException::class);

        Booking::query()->create([
            'reference' => 'MQ-2099-00002',
            'service_name' => 'SEO',
            'name' => 'Other Person',
            'email' => 'other@example.com',
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'video',
            'preferred_date' => $existing->preferred_date->toDateString(),
            'preferred_time' => '10:00',
            'status' => 'pending',
            'consent' => true,
        ]);
    }

    private function book(string $time, string $email): \Illuminate\Testing\TestResponse
    {
        RateLimiter::clear(md5('inquiries127.0.0.1'));

        return $this->postJson('/api/v1/bookings', [
            'service_id' => $this->service->id,
            'name' => 'Jordan Lee',
            'email' => $email,
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'video',
            'preferred_date' => now()->next('Monday')->toDateString(),
            'preferred_time' => $time,
            'consent' => true,
        ]);
    }
}
