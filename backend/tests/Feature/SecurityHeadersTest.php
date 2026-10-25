<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_and_web_responses_set_security_headers_without_hsts_outside_production(): void
    {
        foreach (['/api/v1/site', '/'] as $path) {
            $response = $this->get($path);

            $response->assertHeader('X-Content-Type-Options', 'nosniff');
            $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            $response->assertHeader('X-Frame-Options', 'DENY');
            $response->assertHeader('Content-Security-Policy', "frame-ancestors 'none'");
            $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
            $this->assertNull($response->headers->get('Strict-Transport-Security'));
        }
    }

    public function test_robots_txt_is_the_route_and_not_a_static_file(): void
    {
        $this->assertFileDoesNotExist(public_path('robots.txt'));

        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('Disallow: /admin', false)
            ->assertSee('Disallow: /api', false)
            ->assertSee('Sitemap:', false);
    }

    public function test_production_responses_send_hsts(): void
    {
        $this->app->instance('env', 'production');

        $this->get('/api/v1/site')->assertHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
        );
    }
}
