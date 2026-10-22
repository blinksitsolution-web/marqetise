<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageEditorVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_public_page_json_omits_the_editor(): void
    {
        $editor = User::factory()->create([
            'name' => 'Casey Editor',
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);

        $created = $this->actingAs($editor)->postJson('/api/v1/admin/pages', [
            'title' => 'Staff note',
            'slug' => 'staff-note',
            'body' => 'Published copy',
            'status' => 'published',
        ])->assertCreated();

        $this->assertSame('Casey Editor', $created->json('data.editor'));

        $this->app['auth']->forgetGuards();
        $this->flushSession();

        $public = $this->getJson('/api/v1/pages/staff-note')->assertOk()->json('data');

        $this->assertArrayNotHasKey('editor', $public);
        $this->assertStringNotContainsString('Casey Editor', json_encode($public));
    }
}
