<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginThrottleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_the_sixth_login_attempt_is_rejected(): void
    {
        $user = User::factory()->create();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }

    public function test_ten_failures_lock_the_email_even_when_the_password_is_correct(): void
    {
        $user = User::factory()->create();

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->clearLoginThrottle($user->email);

            $this->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ])->assertUnprocessable()
                ->assertJsonPath('errors.email.0', 'Incorrect email or password.');
        }

        $this->clearLoginThrottle($user->email);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Incorrect email or password.');

        $this->travel(16)->minutes();
        $this->clearLoginThrottle($user->email);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();
    }

    public function test_public_gets_and_authenticated_requests_use_the_api_limiter(): void
    {
        $this->getJson('/api/v1/site')->assertHeader('X-RateLimit-Limit', '120');

        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/api/v1/account', ['name' => 'Updated Name'])
            ->assertOk()
            ->assertHeader('X-RateLimit-Limit', '60');
    }

    private function clearLoginThrottle(string $email): void
    {
        RateLimiter::clear(md5('login'.strtolower($email).'|127.0.0.1'));
    }
}
