<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('users.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'email', 'phone']);
        if ($this->exists('email')) {
            $this->merge(['email' => strtolower((string) $this->input('email'))]);
        }
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+().\\-\\s]{6,30}$/'],
            'role_id' => ['sometimes', 'required', 'integer', 'exists:roles,id'],
            'status' => ['sometimes', 'required', Rule::in(['active', 'invited', 'suspended'])],
        ];
    }
}
