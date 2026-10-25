<?php

namespace Tests\Feature;

use App\Models\Page;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_privacy_and_terms_stay_unpublished(): void
    {
        $this->seed(WebsiteContentSeeder::class);

        $this->getJson('/api/v1/pages/privacy')->assertNotFound();
        $this->getJson('/api/v1/pages/terms')->assertNotFound();

        $slugs = collect($this->getJson('/api/v1/site')->assertOk()->json('data.pages'))->pluck('slug');
        $this->assertFalse($slugs->contains('privacy'));
        $this->assertFalse($slugs->contains('terms'));
    }

    public function test_a_published_privacy_page_is_public(): void
    {
        Page::query()->create([
            'title' => 'Privacy placeholder',
            'slug' => 'privacy',
            'excerpt' => 'Replace this before launch.',
            'body' => 'Placeholder. The owner must replace this with the real privacy notice.',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->getJson('/api/v1/pages/privacy')
            ->assertOk()
            ->assertJsonPath('data.slug', 'privacy');
    }
}
