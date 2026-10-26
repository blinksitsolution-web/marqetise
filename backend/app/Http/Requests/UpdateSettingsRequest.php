<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Rules\GhanaianPhone;
use App\Support\GhanaPhone;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('settings.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $settings = $this->input('settings', []);

        if (! is_array($settings)) {
            return;
        }

        foreach ($settings as $key => $value) {
            if (is_string($value)) {
                $clean = \App\Support\SafeText::clean($value);
                $settings[$key] = $clean === '' ? null : $clean;
            }
        }

        if (is_string($settings['phone'] ?? null)) {
            $settings['phone'] = GhanaPhone::prepare($settings['phone']);
        }

        $this->merge(['settings' => $settings]);
    }

    public function rules(): array
    {
        $allowed = array_merge(config('marqetise.public_setting_keys'), config('marqetise.private_setting_keys'));

        return [
            'settings' => ['required', 'array'],
            'settings.company_name' => ['sometimes', 'required', 'string', 'max:120'],
            'settings.tagline' => ['sometimes', 'nullable', 'string', 'max:240'],
            'settings.email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'settings.phone' => ['sometimes', 'nullable', 'string', new GhanaianPhone],
            'settings.address' => ['sometimes', 'nullable', 'string', 'max:300'],
            'settings.hours' => ['sometimes', 'nullable', 'string', 'max:160'],
            'settings.social_linkedin' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.social_instagram' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.social_facebook' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.social_x' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.social_youtube' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.meta_title' => ['sometimes', 'nullable', 'string', 'max:160'],
            'settings.meta_description' => ['sometimes', 'nullable', 'string', 'max:320'],
            'settings.logo_url' => ['sometimes', 'nullable', 'string', 'max:255', 'regex:/^(\/storage\/|\/media\/|https?:\/\/)/'],
            'settings.notification_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'settings.ip_retention_days' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:3650'],
            'settings.*' => [function (string $attribute, mixed $value, \Closure $fail) use ($allowed): void {
                $key = str_replace('settings.', '', $attribute);
                if (! in_array($key, $allowed, true)) {
                    $fail('That setting cannot be changed from the dashboard.');
                }
            }],
        ];
    }
}
