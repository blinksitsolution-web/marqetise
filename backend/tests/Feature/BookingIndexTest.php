<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingIndexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_the_default_list_includes_a_future_pending_booking_ahead_of_older_completed_rows(): void
    {
        for ($day = 1; $day <= 15; $day++) {
            $this->booking('MQ-2024-'.str_pad((string) $day, 5, '0', STR_PAD_LEFT), 'completed', sprintf('2024-01-%02d', $day));
        }

        $this->booking('MQ-2026-00016', 'pending', now()->addMonth()->toDateString(), '11:00');

        $response = $this->actingAs($this->admin())
            ->getJson('/api/v1/admin/bookings')
            ->assertOk();

        $references = collect($response->json('data'))->pluck('reference');
        $this->assertTrue($references->contains('MQ-2026-00016'));
        $this->assertSame(16, $response->json('meta.total'));
    }

    public function test_completed_bookings_stay_available_on_later_pages(): void
    {
        for ($day = 1; $day <= 16; $day++) {
            $this->booking('MQ-2024-'.str_pad((string) $day, 5, '0', STR_PAD_LEFT), 'completed', sprintf('2024-02-%02d', $day));
        }

        $this->actingAs($this->admin())
            ->getJson('/api/v1/admin/bookings?status=completed&page=2')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'data');
    }

    public function test_a_user_without_bookings_view_cannot_list_bookings(): void
    {
        $editor = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);

        $this->actingAs($editor)->getJson('/api/v1/admin/bookings')->assertForbidden();
    }

    private function admin(): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', 'administrator')->value('id'),
            'status' => 'active',
        ]);
    }

    private function booking(string $reference, string $status, string $date, string $time = '10:00'): void
    {
        Booking::query()->create([
            'reference' => $reference,
            'service_name' => 'SEO',
            'name' => 'Jordan Lee',
            'email' => $reference.'@example.com',
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'video',
            'preferred_date' => $date,
            'preferred_time' => $time,
            'status' => $status,
            'consent' => true,
        ]);
    }
}
