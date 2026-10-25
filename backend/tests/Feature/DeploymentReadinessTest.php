<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DeploymentReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_health_check_reads_the_database(): void
    {
        $this->getJson('/up')
            ->assertOk()
            ->assertJsonPath('status', 'ok');
    }

    public function test_the_health_check_fails_when_the_database_is_unreachable(): void
    {
        DB::shouldReceive('select')->once()->andThrow(new \RuntimeException('database down'));

        $this->getJson('/up')
            ->assertStatus(503)
            ->assertJsonPath('status', 'down');
    }

    public function test_an_untrusted_forwarded_for_header_does_not_change_the_client_ip(): void
    {
        Route::middleware('web')->get('/testing/client-ip', function (Request $request) {
            return response()->json(['ip' => $request->ip()]);
        });

        $this->withHeader('X-Forwarded-For', '203.0.113.5')
            ->getJson('/testing/client-ip')
            ->assertOk()
            ->assertJsonPath('ip', '127.0.0.1');
    }

    public function test_create_database_script_refuses_root_and_an_empty_password(): void
    {
        $script = base_path('scripts/create-database.php');

        $empty = $this->runScript($script, [
            'DB_USERNAME' => 'app',
            'DB_PASSWORD' => '',
            'DB_DATABASE' => 'marqetise',
        ]);
        $this->assertSame(1, $empty['code']);
        $this->assertStringContainsString('empty password', $empty['output']);
        $this->assertStringNotContainsString('database-ready', $empty['output']);

        $root = $this->runScript($script, [
            'DB_USERNAME' => 'root',
            'DB_PASSWORD' => 'secret-value',
            'DB_DATABASE' => 'marqetise',
        ]);
        $this->assertSame(1, $root['code']);
        $this->assertStringContainsString('root', $root['output']);
        $this->assertStringNotContainsString('secret-value', $root['output']);
    }

    public function test_uniqueness_migrations_refuse_duplicates_before_they_change_the_schema(): void
    {
        $checks = [
            '2026_10_25_120000_add_slot_key_to_bookings.php' => 'duplicate pending or confirmed slots exist',
            '2026_10_25_130000_unique_student_email.php' => 'duplicate emails exist',
            '2026_10_25_130100_unique_faq_context_question.php' => 'duplicates exist',
        ];

        foreach ($checks as $file => $message) {
            $source = file_get_contents(database_path('migrations/'.$file));
            $refusal = strpos($source, $message);
            $alter = strpos($source, 'Schema::table');
            $this->assertNotFalse($refusal, $file);
            $this->assertNotFalse($alter, $file);
            $this->assertLessThan($alter, $refusal, $file);
        }
    }

    /**
     * @param  array<string, string>  $env
     * @return array{code: int, output: string}
     */
    private function runScript(string $script, array $env): array
    {
        $prefix = '';
        foreach ($env as $key => $value) {
            $prefix .= $key.'='.escapeshellarg($value).' ';
        }

        $command = $prefix.'php '.escapeshellarg($script).' 2>&1';
        exec($command, $output, $code);

        return ['code' => $code, 'output' => implode("\n", $output)];
    }
}
