<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Support\SameSitePath;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveServiceRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('content.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'slug', 'summary', 'description', 'icon', 'duration_label', 'image_path']);
        $this->merge(['slug' => strtolower((string) $this->input('slug'))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'slug' => [
                'required', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('services', 'slug')->ignore($this->route('service')),
            ],
            'summary' => ['required', 'string', 'max:300'],
            'description' => ['nullable', 'string', 'max:5000'],
            'icon' => ['required', 'string', 'max:40'],
            'image_path' => ['nullable', 'string', 'max:255', function (string $attribute, mixed $value, \Closure $fail): void {
                if (is_string($value) && $value !== '' && ! SameSitePath::isAllowed($value)) {
                    $fail('The image must be a file uploaded on this site.');
                }
            }],
            'image_removed' => ['sometimes', 'boolean'],
            'starting_price' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'duration_label' => ['nullable', 'string', 'max:80'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ];
    }
}
