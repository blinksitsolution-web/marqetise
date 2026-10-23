<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Page;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarqetiseAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_guest_cannot_open_the_dashboard(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }

    public function test_login_rejects_unknown_credentials_without_naming_the_field(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'missing@marqetise.test',
            'password' => 'Correct-Horse-1!',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_content_editor_cannot_create_users(): void
    {
        $editor = $this->userWithRole('content-editor');

        $this->actingAs($editor)->postJson('/api/v1/admin/users', [
            'name' => 'New Person',
            'email' => 'new@marqetise.test',
            'role_id' => Role::query()->where('slug', 'administrator')->value('id'),
            'status' => 'active',
        ])->assertForbidden();
    }

    public function test_administrator_cannot_grant_super_admin(): void
    {
        $admin = $this->userWithRole('administrator');
        $target = $this->userWithRole('content-editor');

        $this->actingAs($admin)->putJson('/api/v1/admin/users/'.$target->id, [
            'role_id' => Role::query()->where('slug', 'super-admin')->value('id'),
            'status' => 'active',
        ])->assertForbidden();

        $this->assertSame('content-editor', $target->fresh()->role->slug);
    }

    public function test_user_cannot_change_their_own_role(): void
    {
        $admin = $this->userWithRole('administrator');

        $this->actingAs($admin)->putJson('/api/v1/admin/users/'.$admin->id, [
            'role_id' => Role::query()->where('slug', 'super-admin')->value('id'),
        ])->assertForbidden();
    }

    public function test_draft_page_and_course_are_hidden_from_the_public_api(): void
    {
        Page::query()->create([
            'title' => 'Secret draft',
            'slug' => 'secret-draft',
            'status' => 'draft',
            'body' => 'Hidden',
        ]);

        Course::query()->create([
            'title' => 'Hidden course',
            'slug' => 'hidden-course',
            'summary' => 'Not ready',
            'category' => 'SEO',
            'level' => 'Beginner',
            'format' => 'Online',
            'status' => 'draft',
        ]);

        $this->getJson('/api/v1/pages/secret-draft')->assertNotFound();
        $this->getJson('/api/v1/courses/hidden-course')->assertNotFound();
    }

    public function test_published_course_is_visible_and_script_tags_are_removed(): void
    {
        $editor = $this->userWithRole('content-editor');

        $this->actingAs($editor)->postJson('/api/v1/admin/courses', [
            'title' => 'Safe course',
            'slug' => 'safe-course',
            'summary' => 'A published course',
            'description' => '<script>alert(1)</script>Learn the work.',
            'category' => 'SEO',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => false,
            'status' => 'published',
            'outcomes' => ['<b>Audit</b> a page'],
            'modules' => [
                ['title' => 'Start', 'lessons' => ['<script>x</script>Intro']],
            ],
        ])->assertCreated();

        $this->getJson('/api/v1/courses/safe-course')
            ->assertOk()
            ->assertJsonPath('data.slug', 'safe-course')
            ->assertJsonMissing(['description' => '<script>alert(1)</script>Learn the work.']);

        $this->assertStringNotContainsString('<script>', Course::query()->first()->description);
    }

    public function test_contact_inquiry_is_validated_and_stored(): void
    {
        $this->postJson('/api/v1/inquiries', [])->assertUnprocessable();

        $this->postJson('/api/v1/inquiries', [
            'type' => 'other',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'subject' => 'SEO help',
            'message' => 'We would like help with the search visibility of our store.',
            'consent' => true,
            'hp_field' => '',
        ])->assertCreated()
            ->assertJsonPath('email_delivered', false)
            ->assertJsonPath('data.status', 'new');

        $this->assertDatabaseHas('inquiries', [
            'email' => 'jordan@example.com',
            'status' => 'new',
        ]);
    }

    public function test_honeypot_and_weekend_booking_are_rejected(): void
    {
        $service = Service::query()->create([
            'name' => 'SEO',
            'slug' => 'seo',
            'summary' => 'Search work',
            'icon' => 'search',
            'status' => 'published',
        ]);

        $this->postJson('/api/v1/inquiries', [
            'type' => 'other',
            'name' => 'Bot',
            'email' => 'bot@example.com',
            'subject' => 'Hello there',
            'message' => 'This is a long enough automated message.',
            'consent' => true,
            'hp_field' => 'http://spam.test',
        ])->assertUnprocessable();

        $this->postJson('/api/v1/bookings', [
            'service_id' => $service->id,
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'video',
            'preferred_date' => now()->next('Saturday')->toDateString(),
            'preferred_time' => '10:00',
            'consent' => true,
        ])->assertUnprocessable();
    }

    public function test_content_editor_can_publish_a_page_that_then_appears_publicly(): void
    {
        $editor = $this->userWithRole('content-editor');

        $this->actingAs($editor)->postJson('/api/v1/admin/pages', [
            'title' => 'Campaign notes',
            'slug' => 'campaign-notes',
            'body' => 'Published copy',
            'status' => 'published',
        ])->assertCreated();

        $this->getJson('/api/v1/pages/campaign-notes')
            ->assertOk()
            ->assertJsonPath('data.body', 'Published copy');
    }

    private function userWithRole(string $slug): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', $slug)->value('id'),
            'status' => 'active',
        ]);
    }
}
