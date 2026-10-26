<?php

namespace Tests\Feature;

use App\Models\ContentBlock;
use App\Models\MediaAsset;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use App\Support\MediaBytes;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MediaStorageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_an_upload_is_stored_in_the_database_and_published(): void
    {
        $editor = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        $file = UploadedFile::fake()->createWithContent('studio.png', $png);

        $response = $this->actingAs($editor)
            ->post('/api/v1/admin/media', ['file' => $file, 'alt' => 'Studio'])
            ->assertCreated();

        $url = $response->json('data.url');
        $this->assertMatchesRegularExpression('#^/media/\d+-[a-f0-9]{64}\.png$#', $url);

        $media = MediaAsset::query()->firstOrFail();
        $this->assertSame(hash('sha256', $png), $media->hash);
        $this->assertSame($url, $media->path);
        $this->assertSame($png, MediaBytes::read($media));

        $served = $this->get($url)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png')
            ->assertHeader('ETag', '"'.$media->hash.'"');
        $cache = (string) $served->headers->get('Cache-Control');
        $this->assertStringContainsString('public', $cache);
        $this->assertStringContainsString('max-age=31536000', $cache);
        $this->assertStringContainsString('immutable', $cache);
        $this->assertSame($png, $served->getContent());

        $this->get($url, ['If-None-Match' => '"'.$media->hash.'"'])->assertNoContent(304);

        $this->seed(WebsiteContentSeeder::class);
        $block = ContentBlock::query()->where('key', 'about.story')->firstOrFail();
        $payload = $block->payload;
        $payload['image'] = $url;
        $payload['image_alt'] = 'Studio';

        $this->actingAs($editor)->putJson('/api/v1/admin/blocks/'.$block->id, [
            'key' => $block->key,
            'group' => $block->group,
            'label' => $block->label,
            'payload' => $payload,
            'is_visible' => $block->is_visible,
            'sort_order' => $block->sort_order,
        ])->assertOk();

        $this->assertSame($url, ContentBlock::query()->where('key', 'about.story')->firstOrFail()->payload['image']);

        $site = $this->getJson('/api/v1/site')->assertOk();
        $this->assertSame(url($url), $site->json('data.blocks')['about.story']['payload']['image']);
        $this->assertStringContainsString('no-store', (string) $site->headers->get('Cache-Control'));

        Service::query()->create([
            'name' => 'Stored media',
            'slug' => 'stored-media',
            'summary' => 'A published service with a database image.',
            'image_path' => $url,
            'status' => 'published',
        ]);

        $this->actingAs($editor)->getJson('/api/v1/admin/services')
            ->assertOk()
            ->assertJsonFragment(['slug' => 'stored-media', 'image_path' => $url]);

        $services = $this->getJson('/api/v1/services')
            ->assertOk()
            ->assertJsonFragment(['slug' => 'stored-media', 'image_path' => url($url)]);
        $this->assertStringContainsString('no-store', (string) $services->headers->get('Cache-Control'));

        $block->update(['payload' => array_merge($payload, ['image' => '/storage/media/missing.jpg'])]);

        $missing = $this->getJson('/api/v1/site')->assertOk();
        $this->assertNull($missing->json('data.blocks')['about.story']['payload']['image']);
        $this->assertSame(
            '/storage/media/missing.jpg',
            ContentBlock::query()->where('key', 'about.story')->firstOrFail()->payload['image'],
        );

        $block->update(['payload' => array_merge($payload, ['image' => 'images/about/about-1-2.jpg'])]);

        $template = $this->getJson('/api/v1/site')->assertOk();
        $this->assertSame('images/about/about-1-2.jpg', $template->json('data.blocks')['about.story']['payload']['image']);

        $admin = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'super-admin')->value('id'),
            'status' => 'active',
        ]);

        $this->actingAs($admin)->putJson('/api/v1/admin/settings', [
            'settings' => ['logo_url' => $url],
        ])->assertOk()->assertJsonPath('data.logo_url', $url);

        $this->getJson('/api/v1/site')
            ->assertOk()
            ->assertJsonPath('data.settings.logo_url', url($url));
    }
}
