<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePageRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('content.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['title', 'slug', 'excerpt', 'body', 'meta_title', 'meta_description']);
        if ($this->filled('slug')) {
            $this->merge(['slug' => strtolower((string) $this->input('slug'))]);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => [
                'required', 'string', 'max:160',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::notIn(config('marqetise.reserved_slugs')),
                Rule::unique('pages', 'slug')->ignore($this->route('page')),
            ],
            'excerpt' => ['nullable', 'string', 'max:400'],
            'body' => ['nullable', 'string', 'max:20000'],
            'meta_title' => ['nullable', 'string', 'max:160'],
            'meta_description' => ['nullable', 'string', 'max:320'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ];
    }
}
