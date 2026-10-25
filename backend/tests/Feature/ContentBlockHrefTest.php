<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentBlockHrefTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_a_hero_link_must_be_a_same_site_path(): void
    {
        $editor = $this->editor();

        $this->actingAs($editor)
            ->postJson('/api/v1/admin/blocks', $this->block('https://evil.example/phish'))
            ->assertUnprocessable()
            ->assertJsonPath('errors.payload.0', 'Links in a content block must be a same-site path starting with /.');

        $this->actingAs($editor)
            ->postJson('/api/v1/admin/blocks', $this->block('javascript:alert(1)'))
            ->assertUnprocessable();

        $this->actingAs($editor)
            ->postJson('/api/v1/admin/blocks', $this->block('//evil.example'))
            ->assertUnprocessable();

        $this->actingAs($editor)
            ->postJson('/api/v1/admin/blocks', $this->block('/book'))
            ->assertCreated()
            ->assertJsonPath('data.payload.primary_href', '/book');
    }

    private function editor(): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function block(string $href): array
    {
        return [
            'key' => 'home.hero',
            'group' => 'home',
            'label' => 'Home hero',
            'is_visible' => true,
            'payload' => [
                'headline' => 'A headline',
                'primary_href' => $href,
            ],
        ];
    }
}
