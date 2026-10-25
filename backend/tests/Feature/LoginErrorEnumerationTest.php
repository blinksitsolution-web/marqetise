<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class LoginErrorEnumerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_failed_sign_in_uses_one_message_and_logs_the_reason_without_the_password(): void
    {
        $records = [];
        Log::listen(function (MessageLogged $event) use (&$records) {
            $records[] = $event;
        });

        $suspended = User::factory()->create(['status' => 'suspended']);
        $invited = User::factory()->create(['status' => 'invited']);

        foreach ([
            [$suspended->email, 'password'],
            [$invited->email, 'password'],
            ['missing-person@example.com', 'wrong-password'],
        ] as [$email, $password]) {
            $this->postJson('/api/v1/auth/login', [
                'email' => $email,
                'password' => $password,
            ])->assertUnprocessable()
                ->assertJsonPath('errors.email.0', 'Incorrect email or password.');
        }

        $reasons = collect($records)
            ->map(fn (MessageLogged $event) => $event->context['reason'] ?? null)
            ->filter()
            ->all();

        $this->assertContains('suspended', $reasons);
        $this->assertContains('invited', $reasons);
        $this->assertContains('unknown_email', $reasons);
        $encoded = json_encode($records);
        $this->assertStringNotContainsString('wrong-password', $encoded);
        $this->assertStringNotContainsString($suspended->email, $encoded);
        $this->assertStringNotContainsString('missing-person@example.com', $encoded);
        $this->assertStringContainsString(hash('sha256', $suspended->email), $encoded);
    }
}
