<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\PermissionCatalog;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class StaffRecordAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_instructor_and_read_only_need_an_assigned_permission_for_students_and_bookings(): void
    {
        $instructorPermissions = PermissionCatalog::roles()['instructor']['permissions'];
        $readOnlyPermissions = PermissionCatalog::roles()['read-only']['permissions'];

        $this->assertNotContains('students.view', $instructorPermissions);
        $this->assertNotContains('bookings.view', $instructorPermissions);
        $this->assertNotContains('students.view', $readOnlyPermissions);
        $this->assertNotContains('bookings.view', $readOnlyPermissions);
        $this->assertContains('users.view', $readOnlyPermissions);

        $instructor = $this->staff('instructor');
        $reader = $this->staff('read-only');

        $this->actingAs($instructor)->getJson('/api/v1/admin/students')->assertForbidden();
        $this->actingAs($instructor)->getJson('/api/v1/admin/bookings')->assertForbidden();
        $this->actingAs($reader)->getJson('/api/v1/admin/students')->assertForbidden();
        $this->actingAs($reader)->getJson('/api/v1/admin/bookings')->assertForbidden();

        $dashboard = $this->actingAs($instructor)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');
        $this->assertArrayNotHasKey('recent_students', $dashboard);
        $this->assertArrayNotHasKey('upcoming_bookings', $dashboard);

        $this->grant('instructor', 'students.view');
        $this->grant('instructor', 'bookings.view');
        $this->grant('read-only', 'students.view');
        $this->grant('read-only', 'bookings.view');

        Auth::forgetGuards();

        $this->actingAs($instructor->fresh())->getJson('/api/v1/admin/students')->assertOk();
        $this->actingAs($instructor->fresh())->getJson('/api/v1/admin/bookings')->assertOk();
        $this->actingAs($reader->fresh())->getJson('/api/v1/admin/students')->assertOk();
        $this->actingAs($reader->fresh())->getJson('/api/v1/admin/bookings')->assertOk();

        $this->actingAs($this->staff('student-support'))->getJson('/api/v1/admin/students')->assertOk();
        $this->actingAs($this->staff('marketing-staff'))->getJson('/api/v1/admin/bookings')->assertOk();
    }

    private function staff(string $role): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', $role)->value('id'),
            'status' => 'active',
        ]);
    }

    private function grant(string $role, string $permission): void
    {
        $record = Role::query()->where('slug', $role)->firstOrFail();
        $record->permissions()->syncWithoutDetaching([
            Permission::query()->where('slug', $permission)->value('id'),
        ]);
    }
}
