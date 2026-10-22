<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveStudentRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('students.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'email', 'phone', 'notes']);
        $this->merge(['email' => strtolower((string) $this->input('email'))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+().\\-\\s]{6,30}$/'],
            'status' => ['required', Rule::in(['active', 'completed', 'waitlist', 'withdrawn'])],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'enrolled_on' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
