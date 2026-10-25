<?php

namespace Tests\Feature;

use App\Models\ContentBlock;
use App\Models\Page;
use App\Models\Role;
use App\Models\User;
use App\Support\PublicContentDefaults;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_public_content_is_inserted_without_replacing_edits(): void
    {
        $this->seed(WebsiteContentSeeder::class);

        ContentBlock::query()->where('key', 'site.chrome')->firstOrFail()->update([
            'payload' => ['cta_label' => 'Kept button', 'cta_href' => '/contact', 'nav' => []],
        ]);
        Page::query()->where('slug', 'services')->firstOrFail()->update([
            'title' => 'Kept services page',
            'body' => 'Kept body',
        ]);

        $this->seed(WebsiteContentSeeder::class);

        $chrome = ContentBlock::query()->where('key', 'site.chrome')->firstOrFail();
        $this->assertSame('Kept button', $chrome->payload['cta_label']);
        $this->assertSame('Kept services page', Page::query()->where('slug', 'services')->firstOrFail()->title);
        $this->assertSame('Kept body', Page::query()->where('slug', 'services')->firstOrFail()->body);

        foreach (PublicContentDefaults::blocks() as $block) {
            $this->assertTrue(ContentBlock::query()->where('key', $block['key'])->exists(), $block['key']);
        }

        $packages = ContentBlock::query()->where('key', 'packages.plans')->firstOrFail();
        $this->assertTrue($packages->is_visible);
        $this->assertSame('Basic Plan', $packages->payload['items'][0]['name']);
    }

    public function test_the_public_payload_includes_chrome_and_omits_empty_packages(): void
    {
        $this->seed(WebsiteContentSeeder::class);

        $site = $this->getJson('/api/v1/site')->assertOk()->json('data');

        $this->assertSame('Get In Touch', $site['blocks']['site.chrome']['payload']['cta_label']);
        $this->assertSame('/about', $site['blocks']['site.chrome']['payload']['nav'][1]['href']);
        $this->assertSame('Basic Plan', $site['blocks']['packages.plans']['payload']['items'][0]['name']);
        $this->assertSame('Services', collect($site['pages'])->firstWhere('slug', 'services')['title']);
        $this->assertSame('', collect($site['pages'])->firstWhere('slug', 'team')['body']);
    }

    public function test_chrome_links_must_stay_on_this_site(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $editor = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);

        $block = ContentBlock::query()->where('key', 'site.chrome')->firstOrFail();

        $this->actingAs($editor)
            ->putJson('/api/v1/admin/blocks/'.$block->id, [
                'key' => 'site.chrome',
                'group' => 'global',
                'label' => 'Header and footer',
                'is_visible' => true,
                'payload' => [
                    'cta_href' => 'news-grid.html',
                    'nav' => [['label' => 'News', 'href' => 'https://evil.example']],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.payload.0', 'Links in a content block must be a same-site path starting with /.');

        $this->actingAs($editor)
            ->putJson('/api/v1/admin/blocks/'.$block->id, [
                'key' => 'site.chrome',
                'group' => 'global',
                'label' => 'Header and footer',
                'is_visible' => true,
                'payload' => [
                    'cta_label' => 'Get In Touch',
                    'cta_href' => '/contact',
                    'nav' => [['label' => 'News', 'href' => '/news']],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.payload.nav.0.href', '/news');
    }
}
