<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Rules\GhanaianPhone;
use App\Support\GhanaPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'email', 'phone', 'company', 'website', 'budget', 'goals']);
        GhanaPhone::mergeNormalized($this, 'phone');
        $this->merge(['email' => strtolower((string) $this->input('email'))]);
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'integer', Rule::exists('services', 'id')->where('status', 'published')],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', new GhanaianPhone],
            'company' => ['nullable', 'string', 'max:160'],
            'website' => ['nullable', 'url', 'max:255'],
            'budget' => ['nullable', 'string', 'max:80'],
            'goals' => ['required', 'string', 'min:20', 'max:5000'],
            'format' => ['required', Rule::in(['video', 'phone', 'office'])],
            'preferred_date' => ['required', 'date', function (string $attribute, mixed $value, \Closure $fail): void {
                $date = \Illuminate\Support\Carbon::parse((string) $value)->startOfDay();
                if ($date->lt(today()) || $date->isWeekend()) {
                    $fail('Choose a weekday that is today or later.');
                }
            }],
            'preferred_time' => ['required', Rule::in(config('marqetise.booking_times'))],
            'consent' => ['accepted'],
            'hp_field' => ['nullable', 'string', 'max:0'],
        ];
    }
}
