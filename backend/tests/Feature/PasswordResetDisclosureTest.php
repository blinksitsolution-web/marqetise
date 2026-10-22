<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

class PasswordResetDisclosureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_forgot_password_response_is_identical_and_does_not_log_a_reset_link(): void
    {
        $log = storage_path('framework/testing-password-reset.log');
        if (is_file($log)) {
            unlink($log);
        }

        config([
            'mail.default' => 'log',
            'mail.mailers.log.channel' => 'password-reset-test',
            'logging.channels.password-reset-test' => [
                'driver' => 'single',
                'path' => $log,
                'level' => 'debug',
            ],
        ]);
        $this->app->forgetInstance('mail.manager');
        Mail::purge('log');

        $user = User::factory()->create(['status' => 'active']);

        $existing = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk()->json();

        $missing = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'missing-person@example.com',
        ])->assertOk()->json();

        $expected = ['message' => "If an account exists, we've sent a link."];

        $this->assertSame($expected, $existing);
        $this->assertSame($expected, $missing);
        $this->assertArrayNotHasKey('email_configured', $existing);

        $contents = is_file($log) ? (string) file_get_contents($log) : '';
        $this->assertStringNotContainsString('reset-password', $contents);
        $this->assertStringNotContainsString('token=', $contents);

        if (is_file($log)) {
            unlink($log);
        }
    }

    public function test_settings_show_mail_delivery_only_to_an_authenticated_admin(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $admin = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'administrator')->value('id'),
            'status' => 'active',
        ]);

        $this->getJson('/api/v1/admin/settings')->assertUnauthorized();

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/settings')
            ->assertOk()
            ->assertJsonPath('mail_can_deliver', false);
    }

    public function test_production_refuses_the_log_mailer(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('log or array mailer');

        $this->app->instance('env', 'production');
        config(['mail.default' => 'log']);

        (new AppServiceProvider($this->app))->boot();
    }
}
