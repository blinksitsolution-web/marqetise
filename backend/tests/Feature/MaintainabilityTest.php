<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Inquiry;
use App\Models\Page;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class MaintainabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_public_course_lists_omit_modules(): void
    {
        $course = Course::query()->create([
            'title' => 'Search',
            'slug' => 'search',
            'summary' => 'A published course summary.',
            'category' => 'Digital Marketing',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => true,
            'status' => 'published',
        ]);
        CourseModule::query()->create([
            'course_id' => $course->id,
            'title' => 'Foundations',
            'lessons' => ['One'],
            'sort_order' => 1,
        ]);

        $list = $this->getJson('/api/v1/courses')->assertOk();
        $this->assertArrayNotHasKey('modules', $list->json('data.0'));

        $this->getJson('/api/v1/courses/search')
            ->assertOk()
            ->assertJsonPath('data.modules.0.title', 'Foundations');

        Page::query()->create([
            'title' => 'About',
            'slug' => 'about',
            'body' => 'The about body.',
            'status' => 'published',
        ]);

        $site = $this->getJson('/api/v1/site')->assertOk();
        $featured = $site->json('data.featured_courses.data.0') ?? $site->json('data.featured_courses.0');
        $this->assertArrayNotHasKey('modules', $featured);
        $this->assertSame('The about body.', $site->json('data.pages.0.body'));
    }

    public function test_a_student_email_cannot_be_reused(): void
    {
        $staff = $this->user('student-support');
        $payload = [
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'status' => 'waitlist',
        ];

        $this->actingAs($staff)->postJson('/api/v1/admin/students', $payload)->assertCreated();
        $this->actingAs($staff)->postJson('/api/v1/admin/students', [
            ...$payload,
            'name' => 'Another Jordan',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_a_course_with_students_cannot_be_deleted(): void
    {
        $course = Course::query()->create([
            'title' => 'Search',
            'slug' => 'search-live',
            'summary' => 'A published course summary.',
            'category' => 'Digital Marketing',
            'level' => 'Beginner',
            'format' => 'Online',
            'certificate_included' => false,
            'featured' => false,
            'status' => 'published',
        ]);
        Student::query()->create([
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'status' => 'active',
            'course_id' => $course->id,
        ]);

        $this->actingAs($this->user('content-editor'))
            ->deleteJson('/api/v1/admin/courses/'.$course->id)
            ->assertStatus(409);

        $this->assertNotNull($course->fresh());
        $this->assertSame($course->id, Student::query()->first()->course_id);
    }

    public function test_a_faq_question_is_unique_within_its_context(): void
    {
        $editor = $this->user('content-editor');
        $payload = [
            'context' => 'contact',
            'question' => 'How quickly will you reply?',
            'answer' => 'Within one business day.',
            'is_published' => true,
        ];

        $this->actingAs($editor)->postJson('/api/v1/admin/faqs', $payload)->assertCreated();
        $this->actingAs($editor)->postJson('/api/v1/admin/faqs', $payload)->assertUnprocessable()->assertJsonValidationErrors('question');
        $this->actingAs($editor)->postJson('/api/v1/admin/faqs', [
            ...$payload,
            'context' => 'courses',
        ])->assertCreated();
    }

    public function test_a_duplicate_inquiry_student_returns_the_existing_row(): void
    {
        $staff = $this->user('student-support');
        $inquiry = Inquiry::query()->create([
            'type' => 'course',
            'name' => 'Jordan Lee',
            'email' => 'jordan@example.com',
            'subject' => 'A course question',
            'message' => 'Please contact me about this course when you can.',
            'status' => 'new',
            'consent' => true,
        ]);

        Student::creating(function (Student $student) use ($inquiry): void {
            if ($student->inquiry_id !== $inquiry->id || Student::query()->where('inquiry_id', $inquiry->id)->exists()) {
                return;
            }

            Student::withoutEvents(function () use ($inquiry): void {
                Student::query()->create([
                    'name' => 'Existing',
                    'email' => 'existing@example.com',
                    'status' => 'waitlist',
                    'inquiry_id' => $inquiry->id,
                ]);
            });
        });

        try {
            $this->actingAs($staff)
                ->postJson('/api/v1/admin/inquiries/'.$inquiry->id.'/student')
                ->assertSuccessful()
                ->assertJsonPath('created', false)
                ->assertJsonPath('data.email', 'existing@example.com');

            $this->assertSame(1, Student::query()->count());
        } finally {
            Student::flushEventListeners();
        }
    }

    public function test_admin_routes_declare_a_permission_except_search(): void
    {
        $routes = collect(Route::getRoutes())->filter(
            fn ($route) => str_contains($route->uri(), 'api/v1/admin')
        );

        $this->assertNotEmpty($routes);

        foreach ($routes as $route) {
            $permissions = collect($route->gatherMiddleware())
                ->filter(fn ($middleware) => is_string($middleware) && str_starts_with($middleware, 'permission:'));

            if (str_ends_with($route->uri(), 'admin/search')) {
                $this->assertTrue($permissions->isEmpty(), $route->uri());
                continue;
            }

            $this->assertTrue($permissions->isNotEmpty(), $route->uri());
        }
    }

    private function user(string $slug): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', $slug)->value('id'),
            'status' => 'active',
        ]);
    }
}
