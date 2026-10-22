<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Password;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class SessionRevocationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_password_change_rejects_the_old_session_and_remember_cookie(): void
    {
        $user = User::factory()->create([
            'password' => 'Old-password-1!',
            'remember_token' => 'old-remember-token-value',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Old-password-1!',
            'remember' => true,
        ])->assertOk();

        $oldCookies = $this->encryptedCookies($login);
        $sessionName = config('session.cookie');
        $rememberName = Auth::guard('web')->getRecallerName();

        $this->assertArrayHasKey($sessionName, $oldCookies);
        $this->assertArrayHasKey($rememberName, $oldCookies);

        DB::table('sessions')->insert([
            'id' => 'other-device-session',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'other-device',
            'payload' => base64_encode('other-device'),
            'last_activity' => time(),
        ]);

        $changed = $this->jsonWithCookies('PATCH', '/api/v1/account', $oldCookies, [
            'current_password' => 'Old-password-1!',
            'password' => 'New-password-1!',
            'password_confirmation' => 'New-password-1!',
        ]);

        $changed->assertOk();

        $this->assertNotSame('old-remember-token-value', $user->fresh()->remember_token);
        $this->assertNull(Auth::guard('web')->getProvider()->retrieveByToken(
            $user->getAuthIdentifierName(),
            'old-remember-token-value',
        ));
        $this->assertDatabaseMissing('sessions', ['id' => 'other-device-session']);

        $this->jsonWithCookies('GET', '/api/v1/auth/user', [
            $sessionName => $oldCookies[$sessionName],
            $rememberName => $oldCookies[$rememberName],
        ])->assertUnauthorized();

        $newCookies = $this->encryptedCookies($changed);
        $this->assertNotSame($oldCookies[$sessionName], $newCookies[$sessionName]);

        $this->jsonWithCookies('GET', '/api/v1/auth/user', [
            $sessionName => $newCookies[$sessionName],
        ])->assertOk();
    }

    public function test_password_reset_revokes_sessions_and_requires_a_new_sign_in(): void
    {
        Event::fake([PasswordReset::class]);

        $user = User::factory()->create([
            'password' => 'Old-password-1!',
            'remember_token' => 'reset-remember-token-value',
        ]);
        $token = Password::broker()->createToken($user);

        DB::table('sessions')->insert([
            'id' => 'reset-device-session',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'reset-device',
            'payload' => base64_encode('reset-device'),
            'last_activity' => time(),
        ]);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'New-password-1!',
            'password_confirmation' => 'New-password-1!',
        ])->assertOk();

        $this->assertDatabaseMissing('sessions', ['id' => 'reset-device-session']);
        $this->assertNotSame('reset-remember-token-value', $user->fresh()->remember_token);
        $this->assertNull(Auth::guard('web')->getProvider()->retrieveByToken(
            $user->getAuthIdentifierName(),
            'reset-remember-token-value',
        ));
        $this->assertGuest();
        Event::assertDispatched(PasswordReset::class);
        $this->getJson('/api/v1/auth/user')->assertUnauthorized();
    }

    /**
     * @return array<string, string>
     */
    private function encryptedCookies(TestResponse $response): array
    {
        $cookies = [];

        foreach ($response->headers->getCookies() as $cookie) {
            $cookies[$cookie->getName()] = $cookie->getValue();
        }

        return $cookies;
    }

    /**
     * @param  array<string, string>  $cookies
     * @param  array<string, mixed>  $data
     */
    private function jsonWithCookies(string $method, string $uri, array $cookies, array $data = []): TestResponse
    {
        $this->app['auth']->forgetGuards();

        if ($this->app->resolved('session')) {
            $this->app['session']->driver()->flush();
        }

        $content = $method === 'GET' ? null : json_encode($data);

        return $this->call(
            $method,
            $uri,
            [],
            $cookies,
            [],
            [
                'HTTP_ACCEPT' => 'application/json',
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ORIGIN' => 'http://localhost',
                'HTTP_REFERER' => 'http://localhost',
                'CONTENT_LENGTH' => $content === null ? 0 : strlen($content),
            ],
            $content,
        );
    }
}
