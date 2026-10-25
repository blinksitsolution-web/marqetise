<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class HttpsUrlTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        URL::forceScheme(null);
        URL::forceRootUrl(null);
        Paginator::currentPathResolver(static fn () => request()->url());

        parent::tearDown();
    }

    public function test_pagination_links_use_https_when_the_production_app_url_is_https(): void
    {
        $this->app['env'] = 'production';
        config(['app.url' => 'https://marqetise.onrender.com']);
        AppServiceProvider::forceHttpsWhenProductionAppUrlIsHttps();

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

        $payload = $this->getJson('/api/v1/courses')->assertOk()->json();
        $encoded = json_encode($payload);

        $this->assertStringStartsWith('https://marqetise.onrender.com/api/v1/courses', $payload['links']['first']);
        $this->assertSame('https://marqetise.onrender.com/api/v1/courses', $payload['meta']['path']);
        $this->assertStringNotContainsString('http://marqetise.onrender.com', $encoded);
    }

    public function test_an_http_production_app_url_does_not_rewrite_the_scheme(): void
    {
        $this->app['env'] = 'production';
        config(['app.url' => 'http://marqetise.test']);
        AppServiceProvider::forceHttpsWhenProductionAppUrlIsHttps();

        $payload = $this->getJson('/api/v1/courses')->assertOk()->json();

        $this->assertStringStartsWith('http://', $payload['links']['first']);
        $this->assertStringNotContainsString('https://marqetise.test', $payload['links']['first']);
    }
}
