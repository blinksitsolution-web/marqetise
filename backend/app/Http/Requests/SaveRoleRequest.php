<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveRoleRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('roles.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'slug', 'description']);
        if ($this->filled('slug')) {
            $this->merge(['slug' => strtolower((string) $this->input('slug'))]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('roles', 'slug')->ignore($this->route('role')),
            ],
            'description' => ['nullable', 'string', 'max:300'],
            'permission_ids' => ['required', 'array', 'min:1'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ];
    }
}
