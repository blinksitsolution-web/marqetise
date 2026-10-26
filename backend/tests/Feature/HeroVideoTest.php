<?php

namespace Tests\Feature;

use App\Models\ContentBlock;
use App\Models\MediaAsset;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class HeroVideoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->seed(WebsiteContentSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_an_mp4_is_stored_and_served_with_range_requests(): void
    {
        $bytes = $this->mp4Bytes();
        $file = UploadedFile::fake()->createWithContent('intro.mp4', $bytes);

        $response = $this->actingAs($this->editor())
            ->post('/api/v1/admin/media', ['file' => $file, 'alt' => 'Intro'])
            ->assertCreated();

        $url = $response->json('data.url');
        $this->assertMatchesRegularExpression('#^/media/\d+-[a-f0-9]{64}\.mp4$#', $url);

        $served = $this->get($url)
            ->assertOk()
            ->assertHeader('Content-Type', 'video/mp4')
            ->assertHeader('Accept-Ranges', 'bytes');
        $this->assertSame($bytes, $served->getContent());

        $partial = $this->get($url, ['Range' => 'bytes=0-3'])
            ->assertStatus(206)
            ->assertHeader('Content-Type', 'video/mp4')
            ->assertHeader('Content-Range', 'bytes 0-3/'.strlen($bytes));
        $this->assertSame(substr($bytes, 0, 4), $partial->getContent());

        $suffix = $this->get($url, ['Range' => 'bytes=-4'])->assertStatus(206);
        $this->assertSame(substr($bytes, -4), $suffix->getContent());
        $this->assertSame(
            'bytes '.(strlen($bytes) - 4).'-'.(strlen($bytes) - 1).'/'.strlen($bytes),
            $suffix->headers->get('Content-Range'),
        );

        $this->get($url, ['Range' => 'bytes=1000-1001'])
            ->assertStatus(416)
            ->assertHeader('Content-Range', 'bytes */'.strlen($bytes));

        $this->get($url, ['Range' => 'bytes=0-1,2-3'])->assertStatus(416);
    }

    public function test_a_video_over_25_mb_or_with_the_wrong_type_is_rejected(): void
    {
        $editor = $this->editor();
        $oversized = $this->oversizedMp4();

        $this->actingAs($editor)
            ->post('/api/v1/admin/media', ['file' => $oversized, 'alt' => 'Too big'])
            ->assertStatus(422)
            ->assertJsonPath('errors.file.0', 'The video must be 25 MB or smaller.');

        $this->assertSame(0, MediaAsset::query()->count());

        $fake = UploadedFile::fake()->createWithContent('notes.mp4', 'this is not a video');
        $this->actingAs($editor)
            ->post('/api/v1/admin/media', ['file' => $fake, 'alt' => 'Notes'])
            ->assertStatus(422)
            ->assertJsonPath('errors.file.0', 'Use a JPEG, PNG, or WebP image, or an MP4, WebM, or MOV video.');

        $gif = UploadedFile::fake()->createWithContent('clip.gif', base64_decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='));
        $this->actingAs($editor)
            ->post('/api/v1/admin/media', ['file' => $gif, 'alt' => 'Gif'])
            ->assertStatus(422)
            ->assertJsonPath('errors.file.0', 'Use a JPEG, PNG, or WebP image, or an MP4, WebM, or MOV video.');
    }

    public function test_the_hero_accepts_a_youtube_link_or_an_uploaded_video_and_can_remove_it(): void
    {
        $editor = $this->editor();
        $block = ContentBlock::query()->where('key', 'home.hero')->firstOrFail();

        $this->putHero($editor, $block, [
            'headline' => 'Marketing that grows',
            'video_url' => 'https://www.youtube.com/watch?v=Lplq8RjQ0zU',
            'video_label' => 'Award winning SEO marketing agency',
        ])->assertOk()
            ->assertJsonPath('data.payload.video_url', 'https://www.youtube.com/embed/Lplq8RjQ0zU')
            ->assertJsonPath('data.payload.video_kind', 'youtube')
            ->assertJsonPath('data.payload.video_removed', false);

        $site = $this->getJson('/api/v1/site')->assertOk();
        $hero = $site->json('data.blocks')['home.hero']['payload'];
        $this->assertSame('https://www.youtube.com/embed/Lplq8RjQ0zU', $hero['video_url']);
        $this->assertSame('Award winning SEO marketing agency', $hero['video_label']);
        $this->assertFalse($hero['video_removed']);

        $bytes = $this->mp4Bytes();
        $uploaded = $this->actingAs($editor)
            ->post('/api/v1/admin/media', ['file' => UploadedFile::fake()->createWithContent('intro.mp4', $bytes), 'alt' => 'Intro'])
            ->assertCreated()
            ->json('data.url');

        $this->putHero($editor, $block, [
            'headline' => 'Marketing that grows',
            'video_url' => $uploaded,
        ])->assertOk()
            ->assertJsonPath('data.payload.video_kind', 'file')
            ->assertJsonPath('data.payload.video_url', $uploaded);

        $fileSite = $this->getJson('/api/v1/site')->assertOk();
        $this->assertSame(url($uploaded), $fileSite->json('data.blocks')['home.hero']['payload']['video_url']);

        $this->putHero($editor, $block, [
            'headline' => 'Marketing that grows',
            'video_url' => 'javascript:alert(1)',
        ])->assertStatus(422)
            ->assertJsonPath('errors.payload.0', 'The intro video must be a YouTube link or a video uploaded on this site.');

        $this->putHero($editor, $block, [
            'headline' => 'Marketing that grows',
            'video_url' => '',
            'video_removed' => true,
        ])->assertOk()
            ->assertJsonPath('data.payload.video_removed', true);

        $removed = $this->getJson('/api/v1/site')->assertOk();
        $removedHero = $removed->json('data.blocks')['home.hero']['payload'];
        $this->assertNull($removedHero['video_url']);
        $this->assertTrue($removedHero['video_removed']);

        $this->putHero($editor, $block, [
            'headline' => 'Marketing that grows',
            'video_url' => '',
        ])->assertOk();

        $stored = ContentBlock::query()->where('key', 'home.hero')->firstOrFail()->payload;
        $this->assertArrayNotHasKey('video_removed', $stored);
        $cleared = $this->getJson('/api/v1/site')->assertOk();
        $this->assertNull($cleared->json('data.blocks')['home.hero']['payload']['video_url']);
        $this->assertArrayNotHasKey('video_removed', $cleared->json('data.blocks')['home.hero']['payload']);
    }

    private function editor(): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function putHero(User $editor, ContentBlock $block, array $payload): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($editor)->putJson('/api/v1/admin/blocks/'.$block->id, [
            'key' => $block->key,
            'group' => $block->group,
            'label' => $block->label,
            'payload' => $payload,
            'is_visible' => $block->is_visible,
            'sort_order' => $block->sort_order,
        ]);
    }

    private function mp4Bytes(): string
    {
        $bytes = hex2bin('000000186674797069736f6d0000000069736f6d69736f320000000866726565');
        $this->assertNotFalse($bytes);

        return $bytes;
    }

    private function oversizedMp4(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'mp4');
        $handle = fopen($path, 'wb');
        fwrite($handle, $this->mp4Bytes());
        fseek($handle, (25 * 1024 * 1024) + 16);
        fwrite($handle, "\0");
        fclose($handle);

        return new UploadedFile($path, 'big.mp4', 'video/mp4', null, true);
    }
}
