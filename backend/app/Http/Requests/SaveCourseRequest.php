<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Support\SafeText;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCourseRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('courses.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize([
            'title', 'slug', 'summary', 'description', 'category', 'level', 'format',
            'duration_label', 'price_label', 'instructor_name', 'instructor_title', 'instructor_bio',
        ]);
        $this->merge([
            'slug' => strtolower((string) $this->input('slug')),
            'outcomes' => SafeText::cleanMixed($this->input('outcomes', [])),
            'modules' => SafeText::cleanMixed($this->input('modules', [])),
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => [
                'required', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('courses', 'slug')->ignore($this->route('course')),
            ],
            'summary' => ['required', 'string', 'max:300'],
            'description' => ['nullable', 'string', 'max:8000'],
            'category' => ['required', 'string', 'max:80'],
            'level' => ['required', Rule::in(['Beginner', 'Intermediate', 'Advanced'])],
            'format' => ['required', 'string', 'max:80'],
            'duration_label' => ['nullable', 'string', 'max:80'],
            'price' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'price_label' => ['nullable', 'string', 'max:80'],
            'certificate_included' => ['required', 'boolean'],
            'next_start_date' => ['nullable', 'date'],
            'featured' => ['required', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'outcomes' => ['nullable', 'array', 'max:12'],
            'outcomes.*' => ['string', 'max:200'],
            'instructor_name' => ['nullable', 'string', 'max:120'],
            'instructor_title' => ['nullable', 'string', 'max:160'],
            'instructor_bio' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'modules' => ['nullable', 'array', 'max:20'],
            'modules.*.title' => ['required', 'string', 'max:160'],
            'modules.*.summary' => ['nullable', 'string', 'max:300'],
            'modules.*.lessons' => ['nullable', 'array', 'max:20'],
            'modules.*.lessons.*' => ['string', 'max:160'],
        ];
    }
}
