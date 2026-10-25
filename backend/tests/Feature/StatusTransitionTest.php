<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Inquiry;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatusTransitionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_a_completed_booking_cannot_return_to_pending(): void
    {
        $booking = Booking::query()->create([
            'reference' => 'MQ-2026-00077',
            'service_name' => 'SEO',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'video',
            'preferred_date' => now()->addWeek()->toDateString(),
            'preferred_time' => '10:00',
            'status' => 'completed',
            'consent' => true,
        ]);

        $this->actingAs($this->staff('marketing-staff'))
            ->patchJson('/api/v1/admin/bookings/'.$booking->id, [
                'status' => 'pending',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.status.0', 'That status change is not allowed.');

        $this->assertSame('completed', $booking->fresh()->status);
    }

    public function test_a_pending_booking_can_be_confirmed(): void
    {
        $booking = Booking::query()->create([
            'reference' => 'MQ-2026-00078',
            'service_name' => 'SEO',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'video',
            'preferred_date' => now()->addWeek()->toDateString(),
            'preferred_time' => '11:00',
            'status' => 'pending',
            'consent' => true,
        ]);

        $this->actingAs($this->staff('marketing-staff'))
            ->patchJson('/api/v1/admin/bookings/'.$booking->id, [
                'status' => 'confirmed',
                'internal_notes' => 'Confirmed by phone.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
    }

    public function test_a_resolved_inquiry_can_be_reopened_but_not_marked_new(): void
    {
        $inquiry = Inquiry::query()->create([
            'type' => 'other',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'subject' => 'SEO help',
            'message' => 'We would like help with the search visibility of our store.',
            'status' => 'resolved',
            'consent' => true,
        ]);

        $staff = $this->staff('marketing-staff');

        $this->actingAs($staff)
            ->patchJson('/api/v1/admin/inquiries/'.$inquiry->id, ['status' => 'new'])
            ->assertUnprocessable();

        $this->actingAs($staff)
            ->patchJson('/api/v1/admin/inquiries/'.$inquiry->id, ['status' => 'in_progress'])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');
    }

    private function staff(string $slug): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', $slug)->value('id'),
            'status' => 'active',
        ]);
    }
}
