<?php

namespace Tests\Feature;

use App\Models\ContentBlock;
use App\Models\Course;
use App\Models\Service;
use App\Support\HomeSectionDefaults;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_home_sections_are_inserted_without_replacing_existing_copy(): void
    {
        $this->seed(WebsiteContentSeeder::class);

        $hero = ContentBlock::query()->where('key', 'home.hero')->firstOrFail();
        $hero->update(['payload' => ['headline' => 'Kept headline', 'primary_href' => '/book']]);

        $services = ContentBlock::query()->where('key', 'home.services')->firstOrFail();
        $services->update(['payload' => ['title' => 'Kept services', 'intro' => 'Kept'], 'is_visible' => false]);

        $this->seed(WebsiteContentSeeder::class);

        $this->assertSame('Kept headline', ContentBlock::query()->where('key', 'home.hero')->firstOrFail()->payload['headline']);
        $this->assertFalse(ContentBlock::query()->where('key', 'home.services')->firstOrFail()->is_visible);
        $this->assertSame('Kept services', ContentBlock::query()->where('key', 'home.services')->firstOrFail()->payload['title']);

        foreach (HomeSectionDefaults::blocks() as $block) {
            $this->assertTrue(ContentBlock::query()->where('key', $block['key'])->exists(), $block['key']);
        }

        $team = ContentBlock::query()->where('key', 'home.team')->firstOrFail();
        $this->assertFalse($team->is_visible);
        $this->assertSame([], $team->payload['items']);
    }

    public function test_the_public_home_payload_omits_hidden_sections_and_includes_real_ones(): void
    {
        $this->seed(WebsiteContentSeeder::class);

        $site = $this->getJson('/api/v1/site')->assertOk()->json('data');

        $this->assertSame('Marketing that grows your business and your skills', $site['blocks']['home.hero']['payload']['headline']);
        $this->assertArrayNotHasKey('home.team', $site['blocks']);
        $this->assertArrayNotHasKey('home.projects', $site['blocks']);
        $this->assertArrayNotHasKey('home.stats', $site['blocks']);
        $this->assertArrayNotHasKey('home.testimonials', $site['blocks']);
        $this->assertSame('Services', $site['blocks']['home.services']['payload']['title']);
    }

    public function test_a_service_image_must_be_an_uploaded_site_path(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $editor = $this->editor();
        $service = Service::query()->create([
            'name' => 'SEO',
            'slug' => 'seo',
            'summary' => 'Search visibility for a real offer.',
            'icon' => 'search',
            'status' => 'published',
        ]);

        $this->actingAs($editor)
            ->putJson('/api/v1/admin/services/'.$service->id, [
                'name' => 'SEO',
                'slug' => 'seo',
                'summary' => 'Search visibility for a real offer.',
                'icon' => 'search',
                'image_path' => 'https://evil.example/logo.png',
                'status' => 'published',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image_path');

        $this->actingAs($editor)
            ->putJson('/api/v1/admin/services/'.$service->id, [
                'name' => 'SEO',
                'slug' => 'seo',
                'summary' => 'Search visibility for a real offer.',
                'icon' => 'search',
                'image_path' => '/storage/media/logo.png',
                'status' => 'published',
            ])
            ->assertOk()
            ->assertJsonPath('data.image_path', '/storage/media/logo.png');
    }

    public function test_a_featured_course_can_store_an_image_path(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $editor = $this->courseEditor();

        $this->actingAs($editor)
            ->postJson('/api/v1/admin/courses', $this->course())
            ->assertCreated()
            ->assertJsonPath('data.image_path', '/storage/media/course.png');

        $this->assertSame('/storage/media/course.png', Course::query()->firstOrFail()->image_path);
    }

    private function editor(): \App\Models\User
    {
        $role = \App\Models\Role::query()->where('slug', 'content-editor')->firstOrFail();

        return \App\Models\User::factory()->create(['role_id' => $role->id, 'status' => 'active']);
    }

    private function courseEditor(): \App\Models\User
    {
        $role = \App\Models\Role::query()->where('slug', 'super-admin')->firstOrFail();

        return \App\Models\User::factory()->create(['role_id' => $role->id, 'status' => 'active']);
    }

    /**
     * @return array<string, mixed>
     */
    private function course(): array
    {
        return [
            'title' => 'Search basics',
            'slug' => 'search-basics',
            'summary' => 'A practical introduction to search.',
            'category' => 'Digital Marketing',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => true,
            'status' => 'published',
            'image_path' => '/storage/media/course.png',
            'outcomes' => [],
            'modules' => [],
        ];
    }
}
