<?php

namespace Tests\Feature;

use App\Models\ContentBlock;
use App\Models\Page;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Support\AboutBannerBlock;
use App\Support\AboutPageCards;
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

        $banner = ContentBlock::query()->where('key', 'about.banner')->firstOrFail();
        $this->assertSame('', $banner->payload['text'] ?? null);
        $banner->update(['payload' => ['text' => 'Kept banner line']]);
        AboutBannerBlock::ensure();
        $this->assertSame('Kept banner line', ContentBlock::query()->where('key', 'about.banner')->firstOrFail()->payload['text']);

        foreach (PublicContentDefaults::blocks() as $block) {
            $this->assertTrue(ContentBlock::query()->where('key', $block['key'])->exists(), $block['key']);
        }

        $packages = ContentBlock::query()->where('key', 'packages.plans')->firstOrFail();
        $this->assertTrue($packages->is_visible);
        $this->assertSame('Basic Plan', $packages->payload['items'][0]['name']);
    }

    public function test_a_missing_storage_logo_is_left_off_the_public_site(): void
    {
        $this->seed(WebsiteContentSeeder::class);
        Setting::putValue('logo_url', 'https://marqetise.test/storage/media/missing.jpg', 'general', true);

        $this->getJson('/api/v1/site')->assertOk()->assertJsonPath('data.settings.logo_url', null);
        $this->assertSame(
            'https://marqetise.test/storage/media/missing.jpg',
            Setting::getValue('logo_url'),
        );

        $directory = storage_path('app/public/media');
        if (! is_dir($directory)) {
            mkdir($directory, 0777, true);
        }
        file_put_contents($directory.'/logo.png', 'png');
        Setting::putValue('logo_url', '/storage/media/logo.png', 'general', true);

        try {
            $this->getJson('/api/v1/site')->assertOk()->assertJsonPath('data.settings.logo_url', '/storage/media/logo.png');
        } finally {
            @unlink($directory.'/logo.png');
        }
    }

    public function test_about_cards_copy_the_page_body_without_replacing_edits(): void
    {
        $this->seed(WebsiteContentSeeder::class);
        $body = <<<'BODY'
# Who we are

Operating under the tagline Beyond Marketing.

## Marqetise Digital Growth

Digital marketing, brand strategy, content creation, advertising and related growth services.

## Marqetise Academy

Practical digital skills education and professional training.

# Our story

The business began as DigiGrowth Hub.

# Our priorities

Strengthen Digital Growth and keep enrolment predictable.

# Our long-term ambition

Become a trusted African digital solutions company.

# Vision

Recognized for driving business growth.

# Mission

Help businesses grow through practical digital education.

# Brand positioning

A storytelling-led digital solutions company.

Its distinguishing principle is to look beyond individual deliverables.

# Core values

## Excellence

Deliver thoughtful, high-quality work.

## Lifelong learning

Build knowledge continuously.
BODY;
        $page = Page::query()->where('slug', 'about')->firstOrFail();
        $page->update(['body' => $body]);
        $identity = ContentBlock::query()->where('key', 'about.identity')->firstOrFail()->payload;
        ContentBlock::query()->whereIn('key', array_keys(AboutPageCards::definitions()))->delete();

        AboutPageCards::ensure();

        $this->assertSame($body, $page->fresh()->body);
        $this->assertSame($identity, ContentBlock::query()->where('key', 'about.identity')->firstOrFail()->payload);

        $who = ContentBlock::query()->where('key', 'about.who')->firstOrFail();
        $this->assertSame('Who we are', $who->payload['title']);
        $this->assertStringContainsString('Beyond Marketing', $who->payload['body']);
        $this->assertSame('Marqetise Academy', $who->payload['items'][1]['title']);

        $this->assertStringContainsString('DigiGrowth Hub', ContentBlock::query()->where('key', 'about.story')->firstOrFail()->payload['body']);
        $this->assertStringContainsString('enrolment predictable', ContentBlock::query()->where('key', 'about.priorities')->firstOrFail()->payload['body']);

        $direction = ContentBlock::query()->where('key', 'about.direction')->firstOrFail()->payload;
        $this->assertSame('Our long-term ambition', $direction['title']);
        $this->assertSame(['Vision', 'Mission', 'Brand positioning'], array_column($direction['items'], 'title'));
        $this->assertStringContainsString('individual deliverables', $direction['items'][2]['body']);

        $values = ContentBlock::query()->where('key', 'about.values')->firstOrFail()->payload;
        $this->assertSame(['Excellence', 'Lifelong learning'], array_column($values['items'], 'title'));
        $this->assertSame([], ContentBlock::query()->where('key', 'about.extra')->firstOrFail()->payload['items']);

        $story = ContentBlock::query()->where('key', 'about.story')->firstOrFail();
        $story->update(['payload' => ['title' => 'Our story', 'body' => 'Kept story', 'image' => '', 'image_alt' => '', 'items' => []]]);
        AboutPageCards::ensure();
        $this->assertSame('Kept story', ContentBlock::query()->where('key', 'about.story')->firstOrFail()->payload['body']);
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
