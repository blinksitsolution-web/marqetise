<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_users_cannot_issue_personal_access_tokens(): void
    {
        $this->assertNotContains(HasApiTokens::class, class_uses_recursive(User::class));
    }

    public function test_a_planted_personal_access_token_cannot_sign_in(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $plain = 'planted-token-secret';

        $id = DB::table('personal_access_tokens')->insertGetId([
            'tokenable_type' => User::class,
            'tokenable_id' => $user->id,
            'name' => 'planted',
            'token' => hash('sha256', $plain),
            'abilities' => json_encode(['*']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withToken($id.'|'.$plain)
            ->getJson('/api/v1/auth/user')
            ->assertUnauthorized();
    }

    public function test_sanctum_rejects_every_bearer_token(): void
    {
        $this->assertIsCallable(Sanctum::$accessTokenAuthenticationCallback);
        $this->assertFalse((Sanctum::$accessTokenAuthenticationCallback)(new PersonalAccessToken(), true));
    }
}
