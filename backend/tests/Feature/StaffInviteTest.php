<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class StaffInviteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_an_invited_user_is_not_created_when_mail_cannot_be_delivered(): void
    {
        config(['mail.default' => 'array']);
        $admin = $this->admin();

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/users', $this->payload())
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Email delivery is not configured, so an invitation cannot be sent.');

        $this->assertSame(1, User::query()->count());
        $this->assertDatabaseMissing('users', ['email' => 'new.person@example.com']);
    }

    public function test_a_deliverable_mailer_creates_an_invited_user_and_sends_a_reset_link(): void
    {
        config(['mail.default' => 'smtp']);
        Notification::fake();

        $this->actingAs($this->admin())
            ->postJson('/api/v1/admin/users', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.status', 'invited')
            ->assertJsonPath('email_delivered', true)
            ->assertJsonMissingPath('data.password');

        $user = User::query()->where('email', 'new.person@example.com')->firstOrFail();
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_an_administrator_can_move_another_user_to_a_role_they_may_assign(): void
    {
        $target = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'marketing-staff')->value('id'),
            'status' => 'active',
        ]);

        $this->actingAs($this->admin())
            ->putJson('/api/v1/admin/users/'.$target->id, [
                'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            ])
            ->assertOk()
            ->assertJsonPath('data.role.slug', 'content-editor');
    }

    public function test_an_administrator_still_cannot_assign_super_admin(): void
    {
        $target = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);

        $this->actingAs($this->admin())
            ->putJson('/api/v1/admin/users/'.$target->id, [
                'role_id' => Role::query()->where('slug', 'super-admin')->value('id'),
            ])
            ->assertForbidden();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        return [
            'name' => 'New Person',
            'email' => 'new.person@example.com',
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
            'send_invite' => true,
        ];
    }

    private function admin(): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', 'administrator')->value('id'),
            'status' => 'active',
        ]);
    }
}
