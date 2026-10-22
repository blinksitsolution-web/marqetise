<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_administrator_cannot_change_a_super_admin_email(): void
    {
        $admin = $this->userWithRole('administrator');
        $super = $this->userWithRole('super-admin');

        $this->actingAs($admin)->putJson('/api/v1/admin/users/'.$super->id, [
            'email' => 'taken-over@example.com',
        ])->assertForbidden();

        $this->assertSame($super->email, $super->fresh()->email);
    }

    public function test_administrator_cannot_change_a_super_admin_email_when_another_super_admin_exists(): void
    {
        $admin = $this->userWithRole('administrator');
        $first = $this->userWithRole('super-admin');
        $second = $this->userWithRole('super-admin');

        $this->actingAs($admin)->putJson('/api/v1/admin/users/'.$first->id, [
            'email' => 'taken-over@example.com',
        ])->assertForbidden();

        $this->assertSame($first->email, $first->fresh()->email);
        $this->assertNotNull($second->fresh());
    }

    public function test_super_admin_can_edit_another_super_admin(): void
    {
        $actor = $this->userWithRole('super-admin');
        $target = $this->userWithRole('super-admin');

        $this->actingAs($actor)->putJson('/api/v1/admin/users/'.$target->id, [
            'email' => 'other.super@example.com',
        ])->assertOk();

        $this->assertSame('other.super@example.com', $target->fresh()->email);
    }

    public function test_nobody_can_demote_or_delete_the_last_super_admin(): void
    {
        $only = $this->userWithRole('super-admin');
        $admin = $this->userWithRole('administrator');
        $editorRole = Role::query()->where('slug', 'content-editor')->value('id');

        $this->actingAs($admin)->putJson('/api/v1/admin/users/'.$only->id, [
            'role_id' => $editorRole,
            'status' => 'suspended',
        ])->assertForbidden();

        $this->actingAs($only)->putJson('/api/v1/admin/users/'.$only->id, [
            'role_id' => $editorRole,
        ])->assertForbidden();

        $this->actingAs($admin)->deleteJson('/api/v1/admin/users/'.$only->id)->assertForbidden();
        $this->actingAs($only)->deleteJson('/api/v1/admin/users/'.$only->id)->assertForbidden();

        $fresh = $only->fresh();
        $this->assertNotNull($fresh);
        $this->assertSame('super-admin', $fresh->role->slug);
        $this->assertSame('active', $fresh->status);
    }

    private function userWithRole(string $slug): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', $slug)->value('id'),
            'status' => 'active',
        ]);
    }
}
