<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInquiryRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'email', 'phone', 'subject', 'message', 'course', 'enquiry']);
        $this->merge(['email' => strtolower((string) $this->input('email'))]);

        if (! $this->filled('type') && $this->filled('enquiry')) {
            $this->merge(['type' => $this->input('enquiry')]);
        }

        if ($this->filled('course')) {
            $this->merge(['course' => strtolower((string) $this->input('course'))]);
        }
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['marketing_services', 'website_development', 'course', 'corporate_training', 'other'])],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+().\\-\\s]{6,30}$/'],
            'subject' => ['required', 'string', 'max:160'],
            'message' => ['required', 'string', 'min:20', 'max:5000'],
            'course' => [
                Rule::requiredIf(fn () => $this->input('type') === 'course'),
                'nullable',
                'string',
                'max:160',
                Rule::exists('courses', 'slug')->where('status', 'published'),
            ],
            'consent' => ['accepted'],
            'hp_field' => ['nullable', 'string', 'max:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'consent.accepted' => 'Please confirm that we may contact you about this inquiry.',
            'message.min' => 'Please enter a message of at least 20 characters.',
            'hp_field.max' => 'The submission could not be accepted.',
        ];
    }
}
