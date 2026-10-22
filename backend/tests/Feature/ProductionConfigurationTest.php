<?php

namespace Tests\Feature;

use App\Providers\AppServiceProvider;
use App\Support\FrontendOrigins;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class ProductionConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_local_requests_do_not_allow_the_ipv4_vite_origin(): void
    {
        $this->assertNotContains('http://127.0.0.1:5173', config('cors.allowed_origins'));

        $response = $this->withHeader('Origin', 'http://127.0.0.1:5173')
            ->getJson('/api/v1/site');

        $this->assertNotSame('http://127.0.0.1:5173', $response->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_local_origins_include_both_vite_hosts(): void
    {
        $origins = FrontendOrigins::list('local', 'https://marqetise.example');

        $this->assertContains('https://marqetise.example', $origins);
        $this->assertContains('http://localhost:5173', $origins);
        $this->assertContains('http://127.0.0.1:5173', $origins);
        $this->assertSame(
            ['https://marqetise.example'],
            FrontendOrigins::list('production', 'https://marqetise.example'),
        );
    }

    public function test_production_refuses_debug_an_insecure_cookie_and_localhost_sanctum(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('APP_DEBUG');

        $this->bootProduction(['app.debug' => true]);
    }

    public function test_production_refuses_an_insecure_session_cookie(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('secure');

        $this->bootProduction(['session.secure' => false]);
    }

    public function test_production_refuses_localhost_in_sanctum_stateful_domains(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('localhost');

        $this->bootProduction(['sanctum.stateful' => ['localhost', 'app.example']]);
    }

    public function test_env_example_documents_production_cookie_and_debug_defaults(): void
    {
        $example = (string) file_get_contents(base_path('.env.example'));

        $this->assertMatchesRegularExpression('/^APP_DEBUG=false$/m', $example);
        $this->assertMatchesRegularExpression('/^SESSION_SECURE_COOKIE=true$/m', $example);
        $this->assertMatchesRegularExpression('/^SESSION_ENCRYPT=true$/m', $example);
        $this->assertStringContainsString('local HTTP', $example);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function bootProduction(array $overrides): void
    {
        $this->app->instance('env', 'production');
        config(array_replace([
            'app.debug' => false,
            'session.secure' => true,
            'sanctum.stateful' => ['app.example'],
            'mail.default' => 'smtp',
        ], $overrides));

        (new AppServiceProvider($this->app))->boot();
    }
}
