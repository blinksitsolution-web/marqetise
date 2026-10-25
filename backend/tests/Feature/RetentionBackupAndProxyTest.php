<?php

namespace Tests\Feature;

use Illuminate\Http\Middleware\TrustProxies;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\Inquiry;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Student;
use App\Models\User;
use App\Support\LegalCopy;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class RetentionBackupAndProxyTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        TrustProxies::flushState();
        parent::tearDown();
    }

    public function test_forwarded_headers_are_ignored_until_a_proxy_is_configured(): void
    {
        $request = Request::create('/up', 'GET', server: [
            'REMOTE_ADDR' => '10.1.1.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.50',
        ]);

        $ignored = app(TrustProxies::class)->handle($request, fn (Request $incoming) => response($incoming->ip()));
        $this->assertSame('10.1.1.1', $ignored->getContent());

        TrustProxies::at(['10.1.1.1']);
        $trusted = app(TrustProxies::class)->handle($request, fn (Request $incoming) => response($incoming->ip()));
        $this->assertSame('203.0.113.50', $trusted->getContent());
        $this->assertNotContains('*', config('marqetise.trusted_proxies'));
    }

    public function test_ip_addresses_stay_until_retention_days_are_saved(): void
    {
        $old = $this->inquiry('203.0.113.8', 40);
        $audit = AuditLog::query()->create([
            'action' => 'settings.updated',
            'ip_address' => '203.0.113.8',
        ]);
        $audit->forceFill(['created_at' => now()->subDays(40)])->save();

        $this->artisan('marqetise:forget-ip-addresses')->assertSuccessful();
        $this->assertSame('203.0.113.8', $old->fresh()->ip_address);

        Setting::putValue('ip_retention_days', 30, 'private', false);
        $recent = $this->inquiry('203.0.113.9', 1);
        $this->artisan('marqetise:forget-ip-addresses')->assertSuccessful();

        $this->assertNull($old->fresh()->ip_address);
        $this->assertSame('203.0.113.9', $recent->fresh()->ip_address);
        $this->assertNull(AuditLog::query()->first()->ip_address);

        $this->getJson('/api/v1/site')
            ->assertOk()
            ->assertJsonMissingPath('data.settings.ip_retention_days');
    }

    public function test_backup_writes_nothing_until_it_is_enabled(): void
    {
        config(['marqetise.backup_enabled' => false]);
        $this->artisan('marqetise:backup')->assertSuccessful();
        $this->assertSame([], glob(storage_path('app/backups/marqetise-*.sqlite')) ?: []);

        $source = tempnam(sys_get_temp_dir(), 'mq-src');
        file_put_contents($source, 'sqlite-bytes');
        $originalDefault = config('database.default');
        $originalDatabase = config('database.connections.sqlite.database');
        config([
            'marqetise.backup_enabled' => true,
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => $source,
        ]);

        try {
            $before = glob(storage_path('app/backups/marqetise-*.sqlite')) ?: [];
            $this->artisan('marqetise:backup')->assertSuccessful();
            $after = array_values(array_diff(glob(storage_path('app/backups/marqetise-*.sqlite')) ?: [], $before));
            $this->assertCount(1, $after);
            $this->assertSame('sqlite-bytes', file_get_contents($after[0]));
            unlink($after[0]);
        } finally {
            config([
                'marqetise.backup_enabled' => false,
                'database.default' => $originalDefault,
                'database.connections.sqlite.database' => $originalDatabase,
            ]);
            unlink($source);
        }
    }

    public function test_a_second_course_for_the_same_email_is_stored_as_an_enrolment(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $admin = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'administrator')->value('id'),
            'status' => 'active',
        ]);
        $first = $this->course('search-basics', 'Search basics');
        $second = $this->course('content-basics', 'Content basics');
        $student = Student::query()->create([
            'name' => 'Ada Scan',
            'email' => 'ada@example.com',
            'status' => 'waitlist',
            'course_id' => $first->id,
        ]);
        $inquiry = Inquiry::query()->create([
            'type' => 'course',
            'name' => 'Ada Scan',
            'email' => 'ada@example.com',
            'subject' => 'Another course',
            'message' => 'Please add me to the second course as well.',
            'status' => 'new',
            'consent' => true,
            'course_id' => $second->id,
        ]);

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/inquiries/'.$inquiry->id.'/student')
            ->assertSuccessful()
            ->assertJsonPath('data.email', 'ada@example.com')
            ->assertJsonPath('data.other_courses.0.title', 'Content basics');

        $this->assertSame(1, Student::query()->count());
        $this->assertDatabaseHas('student_enrolments', [
            'student_id' => $student->id,
            'course_id' => $second->id,
        ]);
        $this->assertSame($first->id, $student->fresh()->course_id);

        $this->actingAs($admin)->putJson('/api/v1/admin/students/'.$student->id, [
            'name' => 'Ada Scan',
            'email' => 'ada@example.com',
            'status' => 'active',
            'course_id' => $second->id,
        ])->assertOk();

        $this->assertDatabaseHas('student_enrolments', [
            'student_id' => $student->id,
            'course_id' => $first->id,
        ]);
    }

    public function test_published_privacy_copy_matches_the_pages_that_ship(): void
    {
        $body = LegalCopy::privacy();
        $this->assertStringContainsString(LegalCopy::NEWSLETTER_BOX_ABSENT, $body);
        $this->assertStringNotContainsString(LegalCopy::NEWSLETTER_BOX_PRESENT, $body);
        $this->assertStringContainsString(LegalCopy::IP_RETENTION_CONFIGURABLE, $body);
        $this->assertStringContainsString('[IP ADDRESS RETENTION PERIOD]', $body);

        $updated = LegalCopy::noteCurrentPublicCopy(
            'Keep this. '.LegalCopy::NEWSLETTER_BOX_PRESENT.' '.LegalCopy::IP_RETENTION_UNSET
        );
        $this->assertStringContainsString('Keep this.', $updated);
        $this->assertStringContainsString(LegalCopy::NEWSLETTER_BOX_ABSENT, $updated);
        $this->assertStringContainsString(LegalCopy::IP_RETENTION_CONFIGURABLE, $updated);
    }

    private function inquiry(string $ip, int $daysAgo): Inquiry
    {
        $inquiry = Inquiry::query()->create([
            'type' => 'contact',
            'name' => 'Ada Scan',
            'email' => 'ada-'.$daysAgo.'@example.com',
            'subject' => 'Hello',
            'message' => 'A message long enough to store.',
            'status' => 'new',
            'consent' => true,
            'ip_address' => $ip,
        ]);
        $inquiry->forceFill(['created_at' => now()->subDays($daysAgo)])->save();

        return $inquiry;
    }

    private function course(string $slug, string $title): Course
    {
        return Course::query()->create([
            'title' => $title,
            'slug' => $slug,
            'summary' => 'A short course summary.',
            'category' => 'Digital Marketing',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => false,
            'status' => 'published',
            'price' => 0,
        ]);
    }
}
