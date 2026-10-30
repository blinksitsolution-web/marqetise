<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use App\Support\GhanaPhone;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPhoneTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_a_profile_update_stores_common_ghana_numbers_and_shows_them_on_reload(): void
    {
        $staff = $this->staff();
        $student = $this->student();

        $cases = [
            '0241234567' => ['+233241234567', '+233 24 123 4567'],
            '024 123 4567' => ['+233241234567', '+233 24 123 4567'],
            '020-123-4567' => ['+233201234567', '+233 20 123 4567'],
            '0501234567' => ['+233501234567', '+233 50 123 4567'],
            '+233 24 123 4567' => ['+233241234567', '+233 24 123 4567'],
            '233241234567' => ['+233241234567', '+233 24 123 4567'],
            '+233593535225' => ['+233593535225', '+233 59 353 5225'],
        ];

        foreach ($cases as $input => [$stored, $display]) {
            $this->actingAs($staff)
                ->putJson('/api/v1/admin/students/'.$student->id, $this->payload($input))
                ->assertOk()
                ->assertJsonPath('data.phone', $display);

            $this->assertSame($stored, $student->fresh()->phone);
        }

        $this->actingAs($staff)
            ->getJson('/api/v1/admin/students/'.$student->id)
            ->assertOk()
            ->assertJsonPath('data.phone', '+233 59 353 5225');
    }

    public function test_an_invalid_profile_phone_is_rejected_and_the_stored_number_stays(): void
    {
        $staff = $this->staff();
        $student = $this->student(['phone' => '+233593535225']);

        $this->actingAs($staff)
            ->putJson('/api/v1/admin/students/'.$student->id, $this->payload('0211234567'))
            ->assertUnprocessable()
            ->assertJsonPath('errors.phone.0', GhanaPhone::MESSAGE);

        $this->assertSame('+233593535225', $student->fresh()->phone);
    }

    public function test_an_empty_profile_phone_clears_the_stored_number(): void
    {
        $staff = $this->staff();
        $student = $this->student(['phone' => '+233593535225']);

        $this->actingAs($staff)
            ->putJson('/api/v1/admin/students/'.$student->id, $this->payload(''))
            ->assertOk()
            ->assertJsonPath('data.phone', null);

        $this->assertNull($student->fresh()->phone);
    }

    public function test_a_profile_update_without_a_phone_keeps_the_stored_number(): void
    {
        $staff = $this->staff();
        $student = $this->student(['phone' => '+233593535225']);
        $payload = $this->payload('0593535225');
        unset($payload['phone']);

        $this->actingAs($staff)
            ->putJson('/api/v1/admin/students/'.$student->id, $payload)
            ->assertOk()
            ->assertJsonPath('data.phone', '+233 59 353 5225');

        $this->assertSame('+233593535225', $student->fresh()->phone);
    }

    private function staff(): User
    {
        return User::factory()->create([
            'role_id' => Role::query()->where('slug', 'student-support')->value('id'),
            'status' => 'active',
        ]);
    }

    private function student(array $overrides = []): Student
    {
        return Student::query()->create([
            'name' => 'Ama Mensah',
            'email' => 'ama@example.com',
            'status' => 'waitlist',
            ...$overrides,
        ]);
    }

    private function payload(string $phone): array
    {
        return [
            'name' => 'Ama Mensah',
            'email' => 'ama@example.com',
            'phone' => $phone,
            'status' => 'waitlist',
        ];
    }
}
