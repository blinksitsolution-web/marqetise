<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Inquiry;
use App\Models\Role;
use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
use App\Support\GhanaPhone;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountPhoneTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('origin', 'http://localhost');
        $this->withHeader('referer', 'http://localhost');
    }

    public function test_a_phone_saves_when_the_password_fields_are_empty(): void
    {
        $user = User::factory()->create(['name' => 'Ama Mensah', 'phone' => null]);

        $this->actingAs($user)
            ->patchJson('/api/v1/account', [
                'name' => 'Ama Mensah',
                'phone' => '059 353 5225',
            ])
            ->assertOk()
            ->assertJsonPath('data.phone', '+233 59 353 5225');

        $this->assertSame('+233593535225', $user->fresh()->phone);

        $this->actingAs($user)
            ->getJson('/api/v1/auth/user')
            ->assertOk()
            ->assertJsonPath('data.phone', '+233 59 353 5225');
    }

    public function test_an_empty_phone_clears_the_stored_number(): void
    {
        $user = User::factory()->create(['phone' => '+233593535225']);

        $this->actingAs($user)
            ->patchJson('/api/v1/account', ['phone' => ''])
            ->assertOk()
            ->assertJsonPath('data.phone', null);

        $this->assertNull($user->fresh()->phone);
    }

    public function test_an_invalid_phone_is_rejected_and_the_stored_number_stays(): void
    {
        $user = User::factory()->create(['phone' => '+233593535225']);

        $this->actingAs($user)
            ->patchJson('/api/v1/account', ['phone' => '0211234567'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.phone.0', GhanaPhone::MESSAGE);

        $this->assertSame('+233593535225', $user->fresh()->phone);
    }

    public function test_a_short_password_in_the_same_request_does_not_save_the_phone(): void
    {
        $user = User::factory()->create([
            'name' => 'Ama Mensah',
            'phone' => null,
            'password' => 'Old-password-1!',
        ]);

        $this->actingAs($user)
            ->patchJson('/api/v1/account', [
                'name' => 'Ama Owusu',
                'phone' => '0593535225',
                'current_password' => 'Old-password-1!',
                'password' => 'short-pass1',
                'password_confirmation' => 'short-pass1',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'The password field must be at least 12 characters.');

        $fresh = $user->fresh();
        $this->assertNull($fresh->phone);
        $this->assertSame('Ama Mensah', $fresh->name);
    }

    public function test_inquiry_booking_and_settings_phones_are_stored_as_e164(): void
    {
        $this->postJson('/api/v1/inquiries', [
            'type' => 'other',
            'name' => 'Ama Mensah',
            'email' => 'ama@example.com',
            'phone' => '024 123 4567',
            'subject' => 'A question',
            'message' => 'We would like help with the search visibility of our store.',
            'consent' => true,
        ])->assertCreated();

        $this->assertSame('+233241234567', Inquiry::query()->value('phone'));

        $this->postJson('/api/v1/inquiries', [
            'type' => 'other',
            'name' => 'Ama Mensah',
            'email' => 'ama@example.com',
            'phone' => '0211234567',
            'subject' => 'A question',
            'message' => 'We would like help with the search visibility of our store.',
            'consent' => true,
        ])->assertUnprocessable()
            ->assertJsonPath('errors.phone.0', GhanaPhone::MESSAGE);

        $service = Service::query()->create([
            'name' => 'SEO',
            'slug' => 'seo',
            'summary' => 'Search work',
            'icon' => 'search',
            'status' => 'published',
        ]);

        $this->postJson('/api/v1/bookings', [
            'service_id' => $service->id,
            'name' => 'Ama Mensah',
            'email' => 'ama@example.com',
            'phone' => '+233 30 123 4567',
            'goals' => 'We want a clearer plan for the next quarter of marketing.',
            'format' => 'phone',
            'preferred_date' => now()->next('Monday')->toDateString(),
            'preferred_time' => '10:00',
            'consent' => true,
        ])->assertCreated();

        $this->assertSame('+233301234567', Booking::query()->value('phone'));

        $admin = User::factory()->create([
            'role_id' => Role::query()->where('slug', 'super-admin')->value('id'),
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'settings' => ['phone' => '0501234567'],
            ])
            ->assertOk()
            ->assertJsonPath('data.phone', '+233 50 123 4567');

        $this->assertSame('+233501234567', Setting::getValue('phone'));

        $this->getJson('/api/v1/site')
            ->assertOk()
            ->assertJsonPath('data.settings.phone', '+233 50 123 4567');
    }
}
