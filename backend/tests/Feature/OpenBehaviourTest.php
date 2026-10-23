<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Inquiry;
use App\Models\Role;
use App\Models\Service;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class OpenBehaviourTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_course_enquiry_uses_a_slug_and_rejects_the_old_type(): void
    {
        $course = Course::query()->create([
            'title' => 'Search course',
            'slug' => 'search-course',
            'summary' => 'A published course used by the enquiry form.',
            'category' => 'SEO',
            'level' => 'Beginner',
            'format' => 'Online',
            'status' => 'published',
        ]);

        $this->postJson('/api/v1/inquiries', [
            'enquiry' => 'course',
            'course' => 'search-course',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'subject' => 'Search course',
            'message' => 'I would like to ask about a place on this course.',
            'consent' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('inquiries', [
            'type' => 'course',
            'course_id' => $course->id,
            'email' => 'jordan@example.com',
        ]);

        $this->postJson('/api/v1/inquiries', [
            'type' => 'contact',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'subject' => 'Old type',
            'message' => 'This uses the enquiry type that is no longer accepted.',
            'consent' => true,
        ])->assertUnprocessable();
    }

    public function test_draft_service_is_hidden_from_the_public_list(): void
    {
        Service::query()->create([
            'name' => 'Draft offer',
            'slug' => 'draft-offer',
            'summary' => 'Not ready for the website.',
            'icon' => 'spark',
            'status' => 'draft',
        ]);
        Service::query()->create([
            'name' => 'Live offer',
            'slug' => 'live-offer',
            'summary' => 'Ready for the website.',
            'icon' => 'spark',
            'status' => 'published',
        ]);

        $this->getJson('/api/v1/services')
            ->assertOk()
            ->assertJsonMissing(['slug' => 'draft-offer'])
            ->assertJsonFragment(['slug' => 'live-offer']);
    }

    public function test_creating_a_student_from_an_inquiry_is_idempotent(): void
    {
        $staff = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'student-support')->value('id'),
            'status' => 'active',
        ]);
        $inquiry = Inquiry::query()->create([
            'type' => 'course',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'subject' => 'A course question',
            'message' => 'Please contact me about this course when you can.',
            'status' => 'new',
            'consent' => true,
        ]);

        $first = $this->actingAs($staff)->postJson('/api/v1/admin/inquiries/'.$inquiry->id.'/student')->assertSuccessful();
        $second = $this->actingAs($staff)->postJson('/api/v1/admin/inquiries/'.$inquiry->id.'/student')->assertSuccessful();

        $this->assertTrue($first->json('created'));
        $this->assertFalse($second->json('created'));
        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, Student::query()->count());
    }

    public function test_student_counts_are_grouped_by_month_in_the_database(): void
    {
        $staff = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'student-support')->value('id'),
            'status' => 'active',
        ]);

        foreach ([1, 2] as $index) {
            $student = Student::query()->create([
                'name' => 'Student '.$index,
                'email' => "student{$index}@example.com",
                'status' => 'active',
            ]);
            $student->forceFill(['created_at' => now()->startOfMonth()])->save();
        }

        $trend = $this->actingAs($staff)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data.enrolment_trend');
        $current = collect($trend)->firstWhere('month', now()->format('Y-m'));

        $this->assertSame(2, $current['students']);
    }

    public function test_gif_uploads_are_rejected(): void
    {
        $editor = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'content-editor')->value('id'),
            'status' => 'active',
        ]);
        $gif = UploadedFile::fake()->createWithContent(
            'mark.gif',
            base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
        );

        $this->actingAs($editor)
            ->post('/api/v1/admin/media', ['file' => $gif, 'alt' => 'Mark'])
            ->assertUnprocessable();
    }
}
