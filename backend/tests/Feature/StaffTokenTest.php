<?php

namespace Tests\Feature;

use App\Models\User;
use Laravel\Sanctum\HasApiTokens;
use Tests\TestCase;

class StaffTokenTest extends TestCase
{
    public function test_staff_users_cannot_issue_personal_access_tokens(): void
    {
        $this->assertNotContains(HasApiTokens::class, class_uses_recursive(User::class));
    }
}
