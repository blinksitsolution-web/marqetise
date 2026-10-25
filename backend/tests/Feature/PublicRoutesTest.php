<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Page;
use App\Support\LegalCopy;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_sitemap_lists_only_pages_the_static_site_can_serve(): void
    {
        $this->seed(WebsiteContentSeeder::class);
        Course::query()->create([
            'title' => 'Search',
            'slug' => 'search-basics',
            'summary' => 'A published course summary.',
            'category' => 'Digital Marketing',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => false,
            'status' => 'published',
        ]);
        Course::query()->create([
            'title' => 'Draft',
            'slug' => 'draft-only',
            'summary' => 'Not published.',
            'category' => 'Digital Marketing',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => false,
            'status' => 'draft',
        ]);
        Page::query()->create([
            'title' => 'Unrouted',
            'slug' => 'not-a-real-page',
            'excerpt' => 'No static file.',
            'body' => 'This slug has no public HTML file.',
            'status' => 'published',
            'published_at' => now(),
        ]);

        config(['marqetise.frontend_url' => 'https://marqetise.test']);
        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        foreach (['/', '/about', '/services', '/courses', '/contact', '/book', '/privacy', '/terms', '/courses/search-basics'] as $path) {
            $this->assertStringContainsString('https://marqetise.test'.$path.'<', $xml);
        }
        $this->assertStringNotContainsString('/courses/draft-only', $xml);
        $this->assertStringNotContainsString('not-a-real-page', $xml);
    }

    public function test_an_unknown_course_slug_is_a_real_404_and_a_published_slug_is_the_detail_page(): void
    {
        Course::query()->create([
            'title' => 'Search',
            'slug' => 'search-basics',
            'summary' => 'A published course summary.',
            'category' => 'Digital Marketing',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => false,
            'status' => 'published',
        ]);

        $this->get('/courses/not-a-real-course')
            ->assertNotFound()
            ->assertHeader('Content-Type', 'text/html; charset=utf-8')
            ->assertSee('Page not found', false);

        $this->get('/courses/search-basics')
            ->assertOk()
            ->assertSee('id="course-detail"', false);

        $nginx = (string) file_get_contents(dirname(base_path()).'/docker/nginx/default.conf');
        $this->assertStringContainsString('fastcgi_hide_header Referrer-Policy', $nginx);
        $this->assertStringContainsString('fastcgi_hide_header X-Frame-Options', $nginx);
        $this->assertStringNotContainsString('rewrite ^ /page-course-details.html last', $nginx);
    }

    public function test_the_public_site_payload_includes_booking_times(): void
    {
        $times = $this->getJson('/api/v1/site')->assertOk()->json('data.booking_times');

        $this->assertContains('09:00', $times);
        $this->assertContains('16:30', $times);
    }

    public function test_the_privacy_notice_mentions_the_public_booking_page_without_replacing_other_text(): void
    {
        $this->seed(WebsiteContentSeeder::class);
        $body = (string) $this->getJson('/api/v1/pages/privacy')->json('data.body');

        $this->assertStringContainsString(LegalCopy::BOOKING_FORM_PRESENT, $body);
        $this->assertStringNotContainsString(LegalCopy::BOOKING_FORM_ABSENT, $body);

        $owner = 'Owner edited this notice. '.LegalCopy::BOOKING_FORM_ABSENT.' Keep this sentence.';
        $updated = LegalCopy::notePublicBookingForm($owner);
        $this->assertStringContainsString('Owner edited this notice.', $updated);
        $this->assertStringContainsString('Keep this sentence.', $updated);
        $this->assertStringContainsString(LegalCopy::BOOKING_FORM_PRESENT, $updated);
        $this->assertStringNotContainsString(LegalCopy::BOOKING_FORM_ABSENT, $updated);
        $this->assertSame('A notice the owner rewrote.', LegalCopy::notePublicBookingForm('A notice the owner rewrote.'));
    }
}
