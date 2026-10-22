<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_content_editor_dashboard_omits_student_user_inquiry_and_booking_data(): void
    {
        $editor = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);

        $data = $this->actingAs($editor)
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->json('data');

        $this->assertArrayNotHasKey('students', $data['counts'] ?? []);
        $this->assertArrayNotHasKey('active_students', $data['counts'] ?? []);
        $this->assertArrayNotHasKey('users', $data['counts'] ?? []);
        $this->assertArrayNotHasKey('new_inquiries', $data['counts'] ?? []);
        $this->assertArrayNotHasKey('pending_bookings', $data['counts'] ?? []);

        foreach (['inquiry_trend', 'enrolment_trend', 'course_enrolments', 'recent_students', 'recent_inquiries', 'upcoming_bookings'] as $block) {
            $this->assertArrayNotHasKey($block, $data);
        }

        $this->assertSame(
            0,
            $data['counts']['published_courses'],
        );
    }
}
